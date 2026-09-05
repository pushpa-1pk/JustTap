const Message = require('../models/message.model');
const Booking = require('../models/booking.model');
const mongoose = require('mongoose');

class MessageRepository {
  constructor() {
    this.model = Message;
    this.bookingModel = Booking;
  }

  async create(data, session = null) {
    const doc = new this.model(data);
    if (session) {
      return doc.save({ session });
    }
    return doc.save();
  }

  async findByBookingId(bookingId, limit = 100, skip = 0) {
    return this.model.find({ bookingId })
      .sort({ sentAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async markAsRead(bookingId, recipientUserId) {
    return this.model.updateMany(
      {
        bookingId,
        senderId: { $ne: String(recipientUserId) },
        readAt: null
      },
      {
        $set: { readAt: new Date() }
      }
    );
  }

  async findUserConversations(userId, role) {
    const userStr = String(userId);
    let matchQuery = {};

    if (role === 'CUSTOMER' || role === 'customer') {
      matchQuery = { customerId: userStr };
    } else if (role === 'PROVIDER' || role === 'provider') {
      matchQuery = {
        $or: [
          { providerId: userStr },
          { 'providerSnapshot.providerId': userStr },
          { providerId: new mongoose.Types.ObjectId(mongoose.Types.ObjectId.isValid(userStr) ? userStr : undefined) }
        ]
      };
    } else {
      matchQuery = {
        $or: [
          { customerId: userStr },
          { providerId: userStr }
        ]
      };
    }

    const bookings = await this.bookingModel.find(matchQuery)
      .select('_id bookingNumber customerId providerId customerSnapshot providerSnapshot serviceDetails bookingStatus scheduledStartTime createdAt')
      .lean();

    if (!bookings || bookings.length === 0) return [];

    const bookingIds = bookings.map(b => b._id);

    const latestMessages = await this.model.aggregate([
      { $match: { bookingId: { $in: bookingIds } } },
      { $sort: { sentAt: -1 } },
      {
        $group: {
          _id: '$bookingId',
          lastMessage: { $first: '$$ROOT' },
          totalCount: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$senderId', userStr] },
                    { $eq: ['$readAt', null] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const statsMap = new Map();
    latestMessages.forEach(item => {
      statsMap.set(String(item._id), item);
    });

    const conversations = [];

    for (const b of bookings) {
      const stats = statsMap.get(String(b._id));
      if (!stats) continue; // Only include bookings that have at least 1 message

      conversations.push({
        bookingId: b._id,
        bookingNumber: b.bookingNumber,
        bookingStatus: b.bookingStatus,
        scheduledStartTime: b.scheduledStartTime,
        serviceName: b.serviceDetails?.name || 'Service Booking',
        customerName: b.customerSnapshot?.fullName || 'Customer',
        providerName: b.providerSnapshot?.businessName || 'Provider',
        customerId: String(b.customerId),
        providerId: String(b.providerId || ''),
        lastMessage: {
          _id: stats.lastMessage._id,
          content: stats.lastMessage.content,
          senderId: stats.lastMessage.senderId,
          senderRole: stats.lastMessage.senderRole,
          sentAt: stats.lastMessage.sentAt,
          readAt: stats.lastMessage.readAt
        },
        unreadCount: stats.unreadCount,
        totalMessages: stats.totalCount
      });
    }

    conversations.sort((a, b) => new Date(b.lastMessage.sentAt).getTime() - new Date(a.lastMessage.sentAt).getTime());

    return conversations;
  }
}

module.exports = MessageRepository;
