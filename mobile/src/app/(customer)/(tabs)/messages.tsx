import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  FlatList,
  Animated,
  Platform,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Shimmer from '@/components/common/Shimmer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GRID = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  radiusCard: 20,
};

const BRAND_COLORS = {
  background: '#FFFFFF',
  secondaryBg: '#FFF9F0',
  primary: '#16A34A', // Green Action / Success
  accent: '#FBBF24', // Yellow Accent
  error: '#EF4444',
  darkText: '#0F172A',
  secondaryText: '#64748B',
  divider: '#E5E7EB',
};

// Custom Scale Pressable for tactile clicks
const ScalePressable = ({ onPress, style, children, disabled }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onPress) onPress();
      }}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default function CustomerMessagesScreen() {
  const { typography } = useTheme();
  const router = useRouter();

  // Screen UI & Sandbox States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PROVIDERS' | 'SUPPORT' | 'UNREAD'>('ALL');
  const [devState, setDevState] = useState<'normal' | 'chat-rahul' | 'chat-support' | 'empty' | 'no-internet' | 'loading'>('normal');
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);

  // Active Chat State overlay
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [attachmentSheetOpen, setAttachmentSheetOpen] = useState(false);

  // Live typing and input states
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Chat message databases
  const [chatMessages, setChatMessages] = useState<Record<string, Array<{
    id: string;
    text: string;
    sender: 'customer' | 'provider' | 'system';
    time: string;
    status?: 'sending' | 'sent' | 'delivered' | 'read';
    attachment?: 'location' | 'photo' | 'document';
    attachmentUrl?: string;
  }>>>({
    rahul: [
      { id: '1', text: 'Booking BK-98402 Confirmed', sender: 'system', time: '10:15 AM' },
      { id: '2', text: 'Vikram Singh has been assigned for your AC repair.', sender: 'system', time: '10:15 AM' },
      { id: '3', text: "Hello! I am on my way to your location. I'll reach in 8 minutes.", sender: 'provider', time: '10:16 AM' },
      { id: '4', text: 'Please keep the room ventilated. Do you have a ladder ready?', sender: 'provider', time: '10:16 AM' },
      { id: '5', text: 'Hi Vikram, yes, the ladder is ready. I have also shared my building gate details.', sender: 'customer', time: '10:18 AM', status: 'read' },
    ],
    support: [
      { id: '1', text: 'Welcome to JustTap Support Centre. Chat here for instant refund, reschedule, or service issues.', sender: 'system', time: '09:00 AM' },
      { id: '2', text: 'Hello, my booking was cancelled but I still have not received my wallet credit refund.', sender: 'customer', time: '09:30 AM', status: 'read' },
      { id: '3', text: 'Checking this right away. We see that refund for booking BK-98402 of ₹299 was initiated successfully.', sender: 'provider', time: '09:32 AM' },
      { id: '4', text: 'The refund has been successfully credited to your JustTap Wallet ledger. Please verify your profile wallet page.', sender: 'provider', time: '09:32 AM' },
      { id: '5', text: 'Thank you! I see the balance in my wallet now.', sender: 'customer', time: '09:40 AM', status: 'read' },
    ],
    amit: [
      { id: '1', text: 'Booking completed successfully.', sender: 'system', time: 'Yesterday' },
      { id: '2', text: 'Please share the leak photos so we can prepare replacement components.', sender: 'provider', time: 'Yesterday' },
      { id: '3', text: 'Shared.', sender: 'customer', time: 'Yesterday', status: 'read' }
    ]
  });

  // Chat inbox summaries
  const inboxChats = useMemo(() => {
    const rawChats = [
      { id: 'rahul', name: 'Vikram Singh (AC Repair)', service: 'AC Repair', lastMsg: 'Please keep the room ventilated...', time: '10:16 AM', unread: 2, online: true, isSupport: false, isPinned: true },
      { id: 'support', name: 'JustTap Helpdesk', service: 'Support', lastMsg: 'The refund has been successfully credited...', time: '09:32 AM', unread: 0, online: true, isSupport: true, isPinned: false },
      { id: 'amit', name: 'Amit Patel (Plumber)', service: 'Plumber', lastMsg: 'Please share the leak photos...', time: 'Yesterday', unread: 0, online: false, isSupport: false, isPinned: false }
    ];

    let filtered = rawChats;

    // Filter by Query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.service.toLowerCase().includes(q) || 
        c.lastMsg.toLowerCase().includes(q)
      );
    }

    // Filter by Tab Chips
    if (selectedFilter !== 'ALL') {
      if (selectedFilter === 'PROVIDERS') {
        filtered = filtered.filter(c => !c.isSupport);
      } else if (selectedFilter === 'SUPPORT') {
        filtered = filtered.filter(c => c.isSupport);
      } else if (selectedFilter === 'UNREAD') {
        filtered = filtered.filter(c => c.unread > 0);
      }
    }

    return filtered;
  }, [searchQuery, selectedFilter]);

  // Sync activeChatId with sandbox devState
  useEffect(() => {
    if (devState === 'chat-rahul') {
      setActiveChatId('rahul');
    } else if (devState === 'chat-support') {
      setActiveChatId('support');
    } else if (devState === 'normal') {
      setActiveChatId(null);
    }
  }, [devState]);

  // Trigger auto-replies
  const handleSendMessage = (text: string) => {
    if (!text.trim() || !activeChatId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newCustomerMsg = {
      id: String(Date.now()),
      text,
      sender: 'customer' as const,
      time: timestamp,
      status: 'sending' as const
    };

    // Update messages
    setChatMessages(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newCustomerMsg]
    }));
    setInputText('');

    // Transition state from sending to read
    setTimeout(() => {
      setChatMessages(prev => {
        const list = prev[activeChatId] || [];
        return {
          ...prev,
          [activeChatId]: list.map(m => m.id === newCustomerMsg.id ? { ...m, status: 'read' as const } : m)
        };
      });
      
      // Trigger provider typing animation mock
      setIsTyping(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 800);

    // Mock replies based on context keywords
    setTimeout(() => {
      setIsTyping(false);
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      let replyText = "Sure, I'll update that on my panel right away. See you soon!";
      if (text.toLowerCase().includes('otp')) {
        replyText = "Got it! Starting job on my app now. Let's get the work completed.";
      } else if (text.toLowerCase().includes('outside')) {
        replyText = "Excellent, I've parked. Coming up the stairs now.";
      } else if (text.toLowerCase().includes('refund')) {
        replyText = "Yes, your payment wallet refund is completed. Check your ledger balance.";
      }

      setChatMessages(prev => ({
        ...prev,
        [activeChatId]: [
          ...(prev[activeChatId] || []),
          { id: String(Date.now() + 1), text: replyText, sender: 'provider', time: replyTime }
        ]
      }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2500);
  };

  const handleShareOTP = () => {
    handleSendMessage("My booking verification OTP is 4829");
  };

  const handleLocationAttachment = () => {
    setAttachmentSheetOpen(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setChatMessages(prev => ({
      ...prev,
      [activeChatId || 'rahul']: [
        ...(prev[activeChatId || 'rahul'] || []),
        { id: String(Date.now()), text: 'Live Location Shared', sender: 'customer', time: timestamp, status: 'read', attachment: 'location' }
      ]
    }));
  };

  const handlePhotoAttachment = () => {
    setAttachmentSheetOpen(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages(prev => ({
      ...prev,
      [activeChatId || 'rahul']: [
        ...(prev[activeChatId || 'rahul'] || []),
        { id: String(Date.now()), text: 'Photo Uploaded', sender: 'customer', time: timestamp, status: 'read', attachment: 'photo', attachmentUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=300' }
      ]
    }));
  };

  // State Switcher Layout Renderers
  if (devState === 'loading') {
    return (
      <View style={[styles.container, { backgroundColor: BRAND_COLORS.background }]}>
        <View style={styles.header}>
          <Shimmer width={150} height={28} borderRadius={4} />
          <Shimmer width={44} height={44} borderRadius={14} />
        </View>
        <ScrollView style={{ paddingHorizontal: 24, paddingTop: GRID.md }}>
          <Shimmer width={'100%'} height={48} borderRadius={14} style={{ marginBottom: GRID.lg }} />
          <Shimmer width={'100%'} height={80} borderRadius={18} style={{ marginBottom: GRID.lg }} />
          <Shimmer width={'100%'} height={80} borderRadius={18} />
        </ScrollView>
        {renderDevMenu()}
      </View>
    );
  }

  if (devState === 'no-internet') {
    return renderEmptyState(
      'cloud-offline-outline',
      'No Internet Connection',
      'Operating in disconnected mode. Chats and updates cannot be loaded.',
      'Retry Connection',
      () => setDevState('normal')
    );
  }

  if (devState === 'empty') {
    return renderEmptyState(
      'chatbubble-ellipses-outline',
      'No conversations yet',
      'Your chats with service professionals and support desks will appear here once bookings start.',
      'Book a Service Now',
      () => setDevState('normal')
    );
  }

  // --- Normal Communication Hub Inbox Render ---
  return (
    <View style={{ flex: 1, backgroundColor: BRAND_COLORS.background }}>
      {/* INBOX CHAT LIST VIEW */}
      {!activeChatId ? (
        <View style={{ flex: 1 }}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={[typography.h1, { color: BRAND_COLORS.darkText, fontSize: 26, fontWeight: '800' }]}>Messages</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <ScalePressable style={styles.headerIconButton} onPress={() => {}}>
                <Ionicons name="search" size={20} color={BRAND_COLORS.darkText} />
              </ScalePressable>
              <ScalePressable style={styles.headerIconButton} onPress={() => {}}>
                <Ionicons name="ellipsis-vertical" size={20} color={BRAND_COLORS.darkText} />
              </ScalePressable>
            </View>
          </View>

          {/* SEARCH BOX */}
          <View style={styles.searchBarBox}>
            <Ionicons name="search" size={18} color={BRAND_COLORS.secondaryText} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: BRAND_COLORS.darkText }]}
              placeholder="Search conversations..."
              placeholderTextColor={BRAND_COLORS.secondaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* FILTER CHIPS */}
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}>
              {filterChips.map(chip => (
                <Pressable
                  key={chip.id}
                  style={[
                    styles.chipBtn,
                    {
                      backgroundColor: selectedFilter === chip.id ? BRAND_COLORS.secondaryBg : '#FFFFFF',
                      borderColor: selectedFilter === chip.id ? BRAND_COLORS.accent : BRAND_COLORS.divider
                    }
                  ]}
                  onPress={() => setSelectedFilter(chip.id as any)}
                >
                  <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>
                    {chip.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Quick Support / FAQ actions bar */}
          <View style={{ paddingHorizontal: 24, marginBottom: GRID.md }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {[
                { label: '🎧 Support Desk', action: () => setDevState('chat-support') },
                { label: '🚨 Emergency Help', action: () => router.push('/bookings') },
                { label: '❓ View FAQ', action: () => {} },
                { label: '⚠️ Report Issue', action: () => {} }
              ].map(action => (
                <Pressable
                  key={action.label}
                  style={[styles.quickActionPill, { borderColor: BRAND_COLORS.divider }]}
                  onPress={action.action}
                >
                  <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>{action.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* SYSTEM BOOKING NOTIFICATION CARD (Pinned update banner) */}
          <View style={[styles.bookingUpdateCard, { backgroundColor: BRAND_COLORS.secondaryBg, borderColor: BRAND_COLORS.accent }]}>
            <Ionicons name="notifications" size={20} color={BRAND_COLORS.accent} />
            <View style={{ flex: 1, marginLeft: GRID.sm }}>
              <Text style={[typography.bodyMedium, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
                Provider Assigned!
              </Text>
              <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, marginTop: 2 }]}>
                Vikram Singh (AC Repair Specialist) is currently reviewing details.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={BRAND_COLORS.darkText} />
          </View>

          {/* CHAT INBOX LIST */}
          <FlatList
            data={inboxChats}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            renderItem={({ item }) => (
              <ScalePressable
                style={[
                  styles.chatRow,
                  {
                    borderColor: BRAND_COLORS.divider,
                    backgroundColor: item.isPinned ? BRAND_COLORS.secondaryBg + '30' : '#FFFFFF'
                  }
                ]}
                onPress={() => {
                  setDevState(item.id === 'rahul' ? 'chat-rahul' : 'chat-support');
                }}
              >
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150' }} style={styles.avatarImg} />
                  {item.online && <View style={[styles.onlineIndicator, { backgroundColor: BRAND_COLORS.primary }]} />}
                </View>

                <View style={styles.chatInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[typography.bodyLarge, { color: BRAND_COLORS.darkText, fontWeight: '800' }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Ionicons name="checkmark-circle" size={14} color={BRAND_COLORS.primary} style={{ marginLeft: 4 }} />
                  </View>
                  <Text style={[typography.bodySmall, { color: BRAND_COLORS.secondaryText, marginTop: 2 }]} numberOfLines={1}>
                    {item.lastMsg}
                  </Text>
                </View>

                <View style={styles.chatMeta}>
                  <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText }]}>{item.time}</Text>
                  {item.unread > 0 ? (
                    <View style={[styles.unreadBadge, { backgroundColor: BRAND_COLORS.error }]}>
                      <Text style={[typography.caption, { color: '#FFFFFF', fontWeight: '800' }]}>{item.unread}</Text>
                    </View>
                  ) : (
                    <Ionicons name="checkmark-done" size={16} color={BRAND_COLORS.primary} />
                  )}
                </View>
              </ScalePressable>
            )}
          />
          {renderDevMenu()}
        </View>
      ) : (
        // --- CHAT ROOM DETAIL SCREEN OVERLAY ---
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
        >
          {/* CHAT HEADER */}
          <View style={[styles.chatHeader, { borderBottomColor: BRAND_COLORS.divider }]}>
            <Pressable onPress={() => setDevState('normal')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={BRAND_COLORS.darkText} />
            </Pressable>
            
            <Image source={{ uri: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150' }} style={styles.chatAvatar} />
            
            <View style={{ flex: 1, marginLeft: GRID.sm }}>
              <Text style={[typography.bodyLarge, { color: BRAND_COLORS.darkText, fontWeight: '800' }]} numberOfLines={1}>
                {activeChatId === 'rahul' ? 'Vikram Singh' : 'JustTap Helpdesk'}
              </Text>
              <Text style={[typography.caption, { color: BRAND_COLORS.primary, fontWeight: '700' }]}>
                Online • Active Dispatch
              </Text>
            </View>

            <ScalePressable style={styles.chatHeaderBtn} onPress={() => {}}>
              <Ionicons name="call" size={20} color={BRAND_COLORS.darkText} />
            </ScalePressable>
            <ScalePressable style={styles.chatHeaderBtn} onPress={() => router.push('/bookings')}>
              <Ionicons name="document-text" size={20} color={BRAND_COLORS.darkText} />
            </ScalePressable>
          </View>

          {/* ACTIVE BOOKING CONTEXT BANNER */}
          <View style={[styles.bookingBanner, { backgroundColor: BRAND_COLORS.secondaryBg }]}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
                Booking BK-98402 • AC Repair & Gas Refill
              </Text>
              <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, marginTop: 2 }]}>
                ETA: Arriving in 8 mins • Out of home servicing
              </Text>
            </View>
            <ScalePressable style={[styles.bannerTrackBtn, { backgroundColor: BRAND_COLORS.accent }]} onPress={() => router.push('/bookings')}>
              <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>Track Live</Text>
            </ScalePressable>
          </View>

          {/* MESSAGES LIST */}
          <FlatList
            data={chatMessages[activeChatId] || []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => {
              const isCust = item.sender === 'customer';
              const isSys = item.sender === 'system';

              if (isSys) {
                return (
                  <View style={styles.systemMsgContainer}>
                    <View style={[styles.systemPill, { backgroundColor: '#F1F5F9' }]}>
                      <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, textAlign: 'center' }]}>
                        {item.text}
                      </Text>
                    </View>
                  </View>
                );
              }

              return (
                <View style={[styles.bubbleWrapper, isCust ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
                  <View style={[
                    styles.msgBubble,
                    isCust ? [styles.customerBubble, { backgroundColor: BRAND_COLORS.primary }] : [styles.providerBubble, { borderColor: BRAND_COLORS.divider }]
                  ]}>
                    
                    {/* Render standard attachments */}
                    {item.attachment === 'location' && (
                      <View style={styles.attachmentView}>
                        <Ionicons name="map" size={32} color={isCust ? '#FFFFFF' : BRAND_COLORS.primary} />
                        <Text style={[typography.bodyMedium, { color: isCust ? '#FFFFFF' : BRAND_COLORS.darkText, fontWeight: '700', marginTop: 4 }]}>
                          Shared Location
                        </Text>
                      </View>
                    )}

                    {item.attachment === 'photo' && (
                      <Image source={{ uri: item.attachmentUrl }} style={styles.attachmentImg} />
                    )}

                    <Text style={[typography.bodyMedium, { color: isCust ? '#FFFFFF' : BRAND_COLORS.darkText }]}>
                      {item.text}
                    </Text>
                    
                    <View style={styles.bubbleMeta}>
                      <Text style={[typography.caption, { color: isCust ? 'rgba(255,255,255,0.7)' : BRAND_COLORS.secondaryText, fontSize: 10 }]}>
                        {item.time}
                      </Text>
                      {isCust && (
                        <Ionicons
                          name={item.status === 'read' ? 'checkmark-done' : 'checkmark'}
                          size={14}
                          color={item.status === 'read' ? BRAND_COLORS.accent : 'rgba(255,255,255,0.6)'}
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
            ListFooterComponent={() => {
              if (isTyping) {
                return (
                  <View style={styles.typingBubbleContainer}>
                    <View style={[styles.typingBubble, { borderColor: BRAND_COLORS.divider }]}>
                      <ActivityIndicator size="small" color={BRAND_COLORS.primary} />
                      <Text style={[typography.caption, { color: BRAND_COLORS.secondaryText, marginLeft: 6 }]}>
                        Specialist typing...
                      </Text>
                    </View>
                  </View>
                );
              }
              return null;
            }}
          />

          {/* KEYBOARD QUICK ACTIONS BAR */}
          {activeChatId === 'rahul' && (
            <View style={[styles.quickActionsBar, { borderTopColor: BRAND_COLORS.divider }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
                <Pressable style={[styles.quickChip, { backgroundColor: BRAND_COLORS.secondaryBg }]} onPress={handleShareOTP}>
                  <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>🔑 Share OTP (4829)</Text>
                </Pressable>
                <Pressable style={styles.quickChip} onPress={() => handleSendMessage("I am outside the gate now.")}>
                  <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>🚪 I'm Outside</Text>
                </Pressable>
                <Pressable style={styles.quickChip} onPress={() => {}}>
                  <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>📞 Call Provider</Text>
                </Pressable>
              </ScrollView>
            </View>
          )}

          {/* CHAT INPUT PANEL */}
          <View style={[styles.chatInputPanel, { borderTopColor: BRAND_COLORS.divider }]}>
            <ScalePressable style={styles.attachBtn} onPress={() => setAttachmentSheetOpen(true)}>
              <Ionicons name="add" size={24} color={BRAND_COLORS.darkText} />
            </ScalePressable>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.chatTextInput, { color: BRAND_COLORS.darkText }]}
                placeholder="Type a message..."
                placeholderTextColor={BRAND_COLORS.secondaryText}
                value={inputText}
                onChangeText={setInputText}
              />
              <Ionicons name="happy-outline" size={22} color={BRAND_COLORS.secondaryText} style={{ marginRight: 8 }} />
            </View>
            {inputText.trim().length > 0 ? (
              <ScalePressable style={[styles.sendBtn, { backgroundColor: BRAND_COLORS.primary }]} onPress={() => handleSendMessage(inputText)}>
                <Ionicons name="send" size={16} color="#FFFFFF" />
              </ScalePressable>
            ) : (
              <ScalePressable style={styles.micInputBtn} onPress={() => {}}>
                <Ionicons name="mic" size={20} color={BRAND_COLORS.darkText} />
              </ScalePressable>
            )}
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ATTACHMENT SELECTION SHEET */}
      <Modal visible={attachmentSheetOpen} transparent animationType="slide">
        <View style={styles.bottomSheetBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setAttachmentSheetOpen(false)} />
          <View style={[styles.bottomSheetContainer, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.sheetHeader}>
              <Text style={[typography.h2, { color: BRAND_COLORS.darkText }]}>Share Attachment</Text>
              <Pressable onPress={() => setAttachmentSheetOpen(false)}>
                <Ionicons name="close" size={24} color={BRAND_COLORS.darkText} />
              </Pressable>
            </View>

            <View style={styles.attachmentOptionsGrid}>
              <Pressable style={styles.attachmentOption} onPress={handlePhotoAttachment}>
                <View style={[styles.attachmentCircle, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="image" size={28} color="#0284C7" />
                </View>
                <Text style={[typography.caption, { marginTop: 6, fontWeight: '700' }]}>Gallery</Text>
              </Pressable>

              <Pressable style={styles.attachmentOption} onPress={handleLocationAttachment}>
                <View style={[styles.attachmentCircle, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="location" size={28} color="#16A34A" />
                </View>
                <Text style={[typography.caption, { marginTop: 6, fontWeight: '700' }]}>Location</Text>
              </Pressable>

              <Pressable style={styles.attachmentOption} onPress={() => setAttachmentSheetOpen(false)}>
                <View style={[styles.attachmentCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="document" size={28} color="#D97706" />
                </View>
                <Text style={[typography.caption, { marginTop: 6, fontWeight: '700' }]}>Document</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  // Inline renderers
  function renderEmptyState(icon: string, title: string, desc: string, btnText: string, onBtnPress: () => void) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: BRAND_COLORS.background }]}>
        <View style={styles.emptyContent}>
          <View style={[styles.emptyIconCircle, { backgroundColor: BRAND_COLORS.secondaryBg }]}>
            <Ionicons name={icon as any} size={48} color={BRAND_COLORS.accent} />
          </View>
          <Text style={[typography.h2, { color: BRAND_COLORS.darkText, marginTop: GRID.xl, fontWeight: '800' }]}>
            {title}
          </Text>
          <Text style={[typography.bodyMedium, { color: BRAND_COLORS.secondaryText, marginTop: GRID.sm, textAlign: 'center', paddingHorizontal: 24, lineHeight: 22 }]}>
            {desc}
          </Text>
          
          <ScalePressable
            style={[styles.emptyActionBtn, { backgroundColor: BRAND_COLORS.accent }]}
            onPress={onBtnPress}
          >
            <Text style={[typography.bodyLarge, { color: BRAND_COLORS.darkText, fontWeight: '800' }]}>
              {btnText}
            </Text>
          </ScalePressable>
        </View>
        {renderDevMenu()}
      </View>
    );
  }

  function renderDevMenu() {
    return (
      <View style={styles.devMenu}>
        <Pressable onPress={() => setIsDevMenuOpen(!isDevMenuOpen)} style={styles.devMenuHeader}>
          <Text style={[typography.bodySmall, { color: BRAND_COLORS.secondaryText, fontWeight: '800' }]}>
            🛠️ Dev Messages Sandbox ({devState.toUpperCase()})
          </Text>
          <Ionicons name={isDevMenuOpen ? 'chevron-up' : 'chevron-down'} size={14} color={BRAND_COLORS.secondaryText} />
        </Pressable>
        {isDevMenuOpen && (
          <View style={styles.devMenuButtons}>
            {[
              { id: 'normal', label: 'Inbox List' },
              { id: 'chat-rahul', label: 'Chat Overlay: Rahul' },
              { id: 'chat-support', label: 'Chat Overlay: Support' },
              { id: 'empty', label: 'Empty Inbox' },
              { id: 'no-internet', label: 'No Internet View' },
              { id: 'loading', label: 'Shimmers' }
            ].map(stateItem => (
              <Pressable
                key={stateItem.id}
                style={[
                  styles.devChip,
                  {
                    backgroundColor: devState === stateItem.id ? BRAND_COLORS.accent : '#F1F5F9',
                    borderColor: devState === stateItem.id ? BRAND_COLORS.accent : BRAND_COLORS.divider,
                  }
                ]}
                onPress={() => {
                  setDevState(stateItem.id as any);
                  setIsDevMenuOpen(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[typography.caption, { color: BRAND_COLORS.darkText, fontWeight: '700' }]}>
                  {stateItem.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  }
}

const filterChips = [
  { id: 'ALL', label: 'All' },
  { id: 'PROVIDERS', label: 'Providers' },
  { id: 'SUPPORT', label: 'Support 🎧' },
  { id: 'UNREAD', label: 'Unread' }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    marginBottom: GRID.md,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND_COLORS.divider,
    marginHorizontal: 24,
    paddingHorizontal: GRID.md,
    backgroundColor: '#F1F5F9',
    marginBottom: GRID.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  filtersContainer: {
    height: 38,
    marginBottom: GRID.md,
  },
  chipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  quickActionPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  bookingUpdateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    padding: GRID.md,
    borderRadius: GRID.radiusCard,
    borderWidth: 1.5,
    marginBottom: GRID.lg,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: GRID.radiusCard,
    borderWidth: 1.5,
    padding: GRID.md,
    marginBottom: GRID.sm,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
    marginLeft: GRID.md,
  },
  chatMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 44 : 10,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: GRID.sm,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: GRID.xs,
  },
  chatHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  bookingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: GRID.md,
  },
  bannerTrackBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  messagesList: {
    padding: GRID.lg,
    paddingBottom: 24,
  },
  systemMsgContainer: {
    alignItems: 'center',
    marginVertical: GRID.sm,
  },
  systemPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: GRID.md,
  },
  msgBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    position: 'relative',
  },
  customerBubble: {
    borderBottomRightRadius: 2,
  },
  providerBubble: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderBottomLeftRadius: 2,
  },
  attachmentView: {
    marginBottom: GRID.xs,
    alignItems: 'center',
  },
  attachmentImg: {
    width: 200,
    height: 120,
    borderRadius: 10,
    marginBottom: GRID.xs,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  typingBubbleContainer: {
    flexDirection: 'row',
    marginBottom: GRID.md,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderRadius: 16,
    borderBottomLeftRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickActionsBar: {
    height: 48,
    borderTopWidth: 1,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BRAND_COLORS.divider,
    backgroundColor: '#F8F9FA',
  },
  chatInputPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: GRID.md,
    borderTopWidth: 1,
    backgroundColor: '#FFFFFF',
    marginBottom: Platform.OS === 'ios' ? 24 : 0,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginHorizontal: GRID.sm,
    paddingHorizontal: GRID.sm,
  },
  chatTextInput: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: GRID.xs,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micInputBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: GRID.lg,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.divider,
  },
  attachmentOptionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: GRID.xl,
    paddingHorizontal: GRID.lg,
  },
  attachmentOption: {
    alignItems: 'center',
  },
  attachmentCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  devMenu: {
    marginHorizontal: 24,
    marginTop: GRID.xl,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: BRAND_COLORS.divider,
    borderRadius: 12,
    overflow: 'hidden',
  },
  devMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: GRID.sm,
    backgroundColor: '#FFFFFF',
  },
  devMenuButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: GRID.sm,
    backgroundColor: '#F8F8F6',
  },
  devChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: GRID.xl,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyActionBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: GRID.xl,
  },
});
