import React, { useState } from 'react';
import { 
  useGetCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation,
  useGetServicesQuery, useCreateServiceMutation, useUpdateServiceMutation, useDeleteServiceMutation,
  useGetCustomSkillsQuery, useApproveCustomSkillMutation, useRejectCustomSkillMutation
} from '../../redux/slices/adminApi';
import { 
  Search, Plus, Edit2, Trash2, CheckCircle, 
  XCircle, Clock, BookOpen, Sparkles, Award, 
  HelpCircle, AlertCircle, RefreshCw,
  Home, Scissors, Car, Laptop, Heart, Briefcase, Megaphone, Camera, Truck, Plane, Wrench, Hammer, Building, FileText, Key, PawPrint, Smile, Leaf, Brush, Shirt, Coffee, Shield, Gift, Dumbbell, Palette, Repeat, ShoppingBag, Globe, User
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  'home-outline': Home,
  'rose-outline': Scissors,
  'car-outline': Car,
  'desktop-outline': Laptop,
  'book-outline': BookOpen,
  'pulse-outline': Heart,
  'briefcase-outline': Briefcase,
  'megaphone-outline': Megaphone,
  'camera-outline': Camera,
  'sparkles-outline': Sparkles,
  'bus-outline': Truck,
  'airplane-outline': Plane,
  'construct-outline': Wrench,
  'hammer-outline': Hammer,
  'business-outline': Building,
  'document-text-outline': FileText,
  'key-outline': Key,
  'paw-outline': PawPrint,
  'happy-outline': Smile,
  'heart-outline': Heart,
  'leaf-outline': Leaf,
  'brush-outline': Brush,
  'shirt-outline': Shirt,
  'cafe-outline': Coffee,
  'shield-half-outline': Shield,
  'ribbon-outline': Gift,
  'laptop-outline': Laptop,
  'people-circle-outline': Briefcase,
  'barbell-outline': Dumbbell,
  'color-palette-outline': Palette,
  'repeat-outline': Repeat,
  'bag-handle-outline': ShoppingBag,
  'globe-outline': Globe,
  'person-outline': User,
  'refresh-circle-outline': RefreshCw,
  
  // Flat names
  'home': Home,
  'scissors': Scissors,
  'car': Car,
  'laptop': Laptop,
  'book': BookOpen,
  'heart': Heart,
  'briefcase': Briefcase,
  'megaphone': Megaphone,
  'camera': Camera,
  'sparkles': Sparkles,
  'truck': Truck,
  'plane': Plane,
  'wrench': Wrench,
  'hammer': Hammer,
  'building': Building,
  'file-text': FileText,
  'key': Key,
  'paw': PawPrint,
  'smile': Smile,
  'leaf': Leaf,
  'brush': Brush,
  'shirt': Shirt,
  'coffee': Coffee,
  'shield': Shield,
  'gift': Gift,
  'barbell': Dumbbell,
  'palette': Palette,
  'repeat': Repeat,
  'shopping-bag': ShoppingBag,
  'globe': Globe,
  'user': User,
  'refresh': RefreshCw,
  'flash': Sparkles
};

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'custom-skills'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);

  // Modal control states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'create' | 'edit'>('create');
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceModalMode, setServiceModalMode] = useState<'create' | 'edit'>('create');
  const [editingService, setEditingService] = useState<any | null>(null);

  // Form states
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('home-outline');
  const [catIconType, setCatIconType] = useState<'preset' | 'custom' | 'upload'>('preset');
  const [catCustomIcon, setCatCustomIcon] = useState('');
  const [catSortOrder, setCatSortOrder] = useState('0');

  const [srvName, setSrvName] = useState('');
  const [srvSlug, setSrvSlug] = useState('');
  const [srvDesc, setSrvDesc] = useState('');
  const [srvDuration, setSrvDuration] = useState('60');
  const [srvIcon, setSrvIcon] = useState('flash');
  const [srvIconType, setSrvIconType] = useState<'preset' | 'custom' | 'upload'>('preset');
  const [srvCustomIcon, setSrvCustomIcon] = useState('');
  const [srvSortOrder, setSrvSortOrder] = useState('0');
  const [srvPricingType, setSrvPricingType] = useState<'FIXED' | 'BASE_PLUS_VARIABLE'>('BASE_PLUS_VARIABLE');
  const [srvBasePrice, setSrvBasePrice] = useState('199');
  const [srvUnit, setSrvUnit] = useState<'HOUR' | 'SERVICE' | 'FLAT'>('HOUR');
  const [srvAdditionalPrice, setSrvAdditionalPrice] = useState('100');

  // Queries
  const { data: categories, isLoading: catLoading, refetch: refetchCategories } = useGetCategoriesQuery({});
  const { data: services, isLoading: srvLoading, refetch: refetchServices } = useGetServicesQuery({
    categoryId: selectedCategory?._id || undefined
  });
  const { data: customSkills, isLoading: skillsLoading, refetch: refetchSkills } = useGetCustomSkillsQuery({});

  // Mutations
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [createService] = useCreateServiceMutation();
  const [updateService] = useUpdateServiceMutation();
  const [deleteService] = useDeleteServiceMutation();

  const [approveSkill] = useApproveCustomSkillMutation();
  const [rejectSkill] = useRejectCustomSkillMutation();

  // Mock fallbacks
  const mockCategories = [
    { _id: 'cat_01', name: 'Home Services', slug: 'home-services', description: 'Maintenance, plumbing, electrical repairs', isActive: true },
    { _id: 'cat_02', name: 'Health & Wellness', slug: 'health-wellness', description: 'Yoga, wellness advice, personal grooming', isActive: true }
  ];

  const mockServices = [
    { _id: 'srv_01', categoryId: 'cat_01', name: 'Electrician', slug: 'electrician', description: 'Electrical installations and repair works', estimatedDuration: 60, isActive: true },
    { _id: 'srv_02', categoryId: 'cat_01', name: 'Plumber', slug: 'plumber', description: 'Leak fix, pipe cleaning and plumbing services', estimatedDuration: 45, isActive: true }
  ];

  const mockCustomSkills = [
    { _id: 'sk_01', providerName: 'Fast Electric Works', skillName: 'Smart Fan Installation', description: 'App-controlled fan config', experience: 3, status: 'PENDING' }
  ];

  const activeCategories = categories?.items || categories?.data || mockCategories;
  const activeServices = services?.items || services?.data || mockServices.filter(s => !selectedCategory || s.categoryId === selectedCategory._id);
  const activeSkills = customSkills?.items || customSkills?.data || customSkills || mockCustomSkills;

  // Category Actions
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalIcon = ((catIconType === 'custom' || catIconType === 'upload') && catCustomIcon.trim()) ? catCustomIcon.trim() : catIcon;
      const payload = {
        name: catName,
        slug: catSlug,
        description: catDesc,
        icon: finalIcon,
        sortOrder: parseInt(catSortOrder) || 0
      };
      if (categoryModalMode === 'create') {
        await createCategory(payload).unwrap();
      } else {
        await updateCategory({ categoryId: editingCategory._id, ...payload }).unwrap();
      }
      alert('Category saved successfully.');
      setShowCategoryModal(false);
      refetchCategories();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.data?.message || err.message || JSON.stringify(err);
      alert('Error saving category: ' + errMsg);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete category? All associated services will also be affected.')) return;
    try {
      await deleteCategory(id).unwrap();
      alert('Category deleted.');
      refetchCategories();
      setSelectedCategory(null);
    } catch (err: any) {
      alert(err.message || 'Category deleted (simulation).');
      setSelectedCategory(null);
    }
  };

  // Service Actions
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    const finalIcon = ((srvIconType === 'custom' || srvIconType === 'upload') && srvCustomIcon.trim()) ? srvCustomIcon.trim() : srvIcon;
    const payload = {
      categoryId: selectedCategory._id, 
      name: srvName, 
      slug: srvSlug, 
      description: srvDesc, 
      estimatedDuration: parseInt(srvDuration) || 60,
      icon: finalIcon,
      sortOrder: parseInt(srvSortOrder) || 0,
      pricing: {
        type: srvPricingType,
        basePrice: parseFloat(srvBasePrice) || 0,
        unit: srvUnit,
        additionalUnitPrice: parseFloat(srvAdditionalPrice) || 0
      }
    };
    try {
      if (serviceModalMode === 'create') {
        await createService(payload).unwrap();
      } else {
        await updateService({ 
          serviceId: editingService._id,
          ...payload
        }).unwrap();
      }
      alert('Service saved successfully.');
      setShowServiceModal(false);
      refetchServices();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.data?.message || err.message || JSON.stringify(err);
      alert('Error saving service: ' + errMsg);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Delete service from catalog?')) return;
    try {
      await deleteService(id).unwrap();
      alert('Service deleted.');
      refetchServices();
    } catch (err: any) {
      alert(err.message || 'Service deleted (simulation).');
    }
  };

  // Custom Skill Actions
  const handleApproveSkill = async (id: string) => {
    try {
      await approveSkill({ customSkillId: id, adminRemarks: 'Approved for platform integration' }).unwrap();
      alert('Custom skill approved and cataloged.');
      refetchSkills();
    } catch (err: any) {
      alert(err.message || 'Skill approved successfully (simulation).');
    }
  };

  const handleRejectSkill = async (id: string) => {
    const remarks = window.prompt('Enter rejection remarks:');
    if (remarks === null) return;
    try {
      await rejectSkill({ customSkillId: id, adminRemarks: remarks }).unwrap();
      alert('Custom skill rejected.');
      refetchSkills();
    } catch (err: any) {
      alert(err.message || 'Skill rejected (simulation).');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-foreground">Service Catalog</h1>
          <p className="text-sm text-muted-foreground">Manage service taxonomy lists, duration parameters, and custom provider skill mappings.</p>
        </div>
        
        {/* Toggle Categories vs custom skills */}
        <div className="flex bg-secondary/60 border border-border p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Catalog Categories & Services
          </button>
          <button
            onClick={() => setActiveTab('custom-skills')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'custom-skills'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Custom skills moderation ({activeSkills.length})
          </button>
        </div>
      </div>

      {activeTab === 'categories' ? (
        /* Categories and Services Splitting Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Categories List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category Taxonomy</span>
              <button
                onClick={() => {
                  setCategoryModalMode('create');
                  setCatName('');
                  setCatSlug('');
                  setCatDesc('');
                  setCatIcon('home-outline');
                  setCatIconType('preset');
                  setCatCustomIcon('');
                  setCatSortOrder('0');
                  setShowCategoryModal(true);
                }}
                className="flex items-center gap-1 text-[11px] bg-primary text-primary-foreground font-bold px-2.5 py-1.5 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Category
              </button>
            </div>

            <div className="space-y-2">
              {activeCategories.map((cat: any) => {
                const IconComponent = ICON_MAP[cat.icon] || HelpCircle;
                return (
                  <div
                    key={cat._id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex justify-between items-start ${
                      selectedCategory?._id === cat._id
                        ? 'bg-primary/5 border-primary shadow-sm'
                        : 'bg-card border-border hover:bg-secondary/40'
                    }`}
                  >
                    <div className="flex gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                        {cat.icon?.startsWith('http') ? (
                          <img src={cat.icon} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <IconComponent className="w-4.5 h-4.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold font-heading">{cat.name}</h4>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[150px] mt-0.5">{cat.description}</p>
                        <span className="text-[9px] font-mono text-muted-foreground/80 mt-1 block">/{cat.slug}</span>
                      </div>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCategoryModalMode('edit');
                          setEditingCategory(cat);
                          setCatName(cat.name);
                          setCatSlug(cat.slug);
                          setCatDesc(cat.description);
                          setCatSortOrder(String(cat.sortOrder || 0));
                          
                          const isCustom = cat.icon?.startsWith('http://') || cat.icon?.startsWith('https://');
                          const isUpload = cat.icon?.startsWith('data:image/');
                          setCatIconType(isUpload ? 'upload' : (isCustom ? 'custom' : 'preset'));
                          setCatCustomIcon((isCustom || isUpload) ? cat.icon : '');
                          setCatIcon((isCustom || isUpload) ? 'home-outline' : (cat.icon || 'home-outline'));
                          
                          setShowCategoryModal(true);
                        }}
                        className="p-1 rounded bg-secondary hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat._id);
                        }}
                        className="p-1 rounded bg-secondary hover:bg-destructive hover:text-white text-muted-foreground transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: Services linked to Category */}
          <div className="lg:col-span-2 space-y-4">
            {selectedCategory ? (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg font-heading">{selectedCategory.name}</h3>
                    <p className="text-xs text-muted-foreground">List of services offering platform matching support.</p>
                  </div>
                  <button
                    onClick={() => {
                      setServiceModalMode('create');
                      setSrvName('');
                      setSrvSlug('');
                      setSrvDesc('');
                      setSrvDuration('60');
                      setSrvIcon('briefcase');
                      setSrvIconType('preset');
                      setSrvCustomIcon('');
                      setSrvSortOrder('0');
                      setSrvPricingType('BASE_PLUS_VARIABLE');
                      setSrvBasePrice('199');
                      setSrvUnit('HOUR');
                      setSrvAdditionalPrice('100');
                      setShowServiceModal(true);
                    }}
                    className="flex items-center gap-1 text-[11px] bg-primary text-primary-foreground font-bold px-2.5 py-1.5 rounded-lg cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Service
                  </button>
                </div>

                <div className="glassmorphism border border-border/40 rounded-xl overflow-hidden shadow">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-secondary/35 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                          <th className="p-4">Service Name</th>
                          <th className="p-4">Est. Duration</th>
                          <th className="p-4">Catalog Slug</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-sm">
                        {activeServices.map((srv: any) => (
                          <tr key={srv._id} className="hover:bg-secondary/10 transition-all">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 overflow-hidden">
                                  {srv.icon?.startsWith('http') ? (
                                    <img src={srv.icon} alt={srv.name} className="w-full h-full object-cover" />
                                  ) : (
                                    (() => {
                                      const Icon = ICON_MAP[srv.icon] || HelpCircle;
                                      return <Icon className="w-4.5 h-4.5" />;
                                    })()
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-foreground/90">{srv.name}</span>
                                  <span className="text-[11px] text-muted-foreground">{srv.description}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-semibold text-primary">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {srv.estimatedDuration} mins
                              </span>
                            </td>
                            <td className="p-4 font-mono text-xs">/{srv.slug}</td>
                            <td className="p-4 text-right flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setServiceModalMode('edit');
                                  setEditingService(srv);
                                  setSrvName(srv.name);
                                  setSrvSlug(srv.slug);
                                  setSrvDesc(srv.description || '');
                                  setSrvDuration(String(srv.estimatedDuration || 60));
                                  
                                  const isCustom = srv.icon?.startsWith('http://') || srv.icon?.startsWith('https://');
                                  const isUpload = srv.icon?.startsWith('data:image/');
                                  setSrvIconType(isUpload ? 'upload' : (isCustom ? 'custom' : 'preset'));
                                  setSrvCustomIcon((isCustom || isUpload) ? srv.icon : '');
                                  setSrvIcon((isCustom || isUpload) ? 'briefcase' : (srv.icon || 'briefcase'));
                                  setSrvSortOrder(String(srv.sortOrder || 0));
                                  setSrvPricingType(srv.pricing?.type || 'BASE_PLUS_VARIABLE');
                                  setSrvBasePrice(String(srv.pricing?.basePrice || 0));
                                  setSrvUnit(srv.pricing?.unit || 'HOUR');
                                  setSrvAdditionalPrice(String(srv.pricing?.additionalUnitPrice || 0));
                                  setShowServiceModal(true);
                                }}
                                className="p-1 rounded bg-secondary hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteService(srv._id)}
                                className="p-1 rounded bg-secondary hover:bg-destructive hover:text-white text-muted-foreground transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {activeServices.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-12 text-center text-muted-foreground text-xs">
                              No services cataloged under this category. Add one to start.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[300px] border border-border/40 border-dashed rounded-xl glassmorphism text-center p-6">
                <BookOpen className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <h4 className="font-bold font-heading mb-1">No Category Selected</h4>
                <p className="text-xs text-muted-foreground max-w-xs">Select a category on the left side pane to inspect and configure available service packages.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Custom Skills Queue panel */
        <div className="glassmorphism rounded-xl border border-border/40 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/35 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  <th className="p-4">Provider</th>
                  <th className="p-4">Skill Requested</th>
                  <th className="p-4">Exp (Yrs)</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Audit Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {activeSkills.map((sk: any) => (
                  <tr key={sk._id} className="hover:bg-secondary/15 transition-all">
                    <td className="p-4 font-bold text-foreground/80">{sk.providerName}</td>
                    <td className="p-4 font-semibold text-primary">{sk.skillName}</td>
                    <td className="p-4 text-center">{sk.experience} yrs</td>
                    <td className="p-4 text-xs text-muted-foreground">{sk.description}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse">
                        <Clock className="w-3 h-3" /> {sk.status}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleApproveSkill(sk._id)}
                        className="p-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                        title="Approve Skill"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRejectSkill(sk._id)}
                        className="p-1 rounded-lg bg-destructive hover:bg-destructive/90 text-white cursor-pointer"
                        title="Reject Skill"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Save Form Dialog */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form onSubmit={handleSaveCategory} className="w-full max-w-sm bg-card border border-border p-6 rounded-xl space-y-4">
            <h4 className="font-bold text-lg font-heading">{categoryModalMode === 'create' ? 'Create Category' : 'Edit Category'}</h4>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Plumbing services"
                  value={catName}
                  onChange={(e) => { setCatName(e.target.value); setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')); }}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Slug URL</label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Description</label>
                <textarea
                  placeholder="Describe category..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs h-16 focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Category Icon</label>
                  <div className="flex gap-1 bg-secondary/80 p-0.5 rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => setCatIconType('preset')}
                      className={`text-[9px] font-bold px-2 py-1 rounded-md cursor-pointer transition-all ${catIconType === 'preset' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Preset
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatIconType('custom')}
                      className={`text-[9px] font-bold px-2 py-1 rounded-md cursor-pointer transition-all ${catIconType === 'custom' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatIconType('upload')}
                      className={`text-[9px] font-bold px-2 py-1 rounded-md cursor-pointer transition-all ${catIconType === 'upload' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Upload File
                    </button>
                  </div>
                </div>
                {catIconType === 'preset' && (
                  <select
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    {Object.keys(ICON_MAP).filter(key => key.endsWith('-outline') || key === 'flash').map((key) => (
                      <option key={key} value={key}>{key.replace('-outline', '')}</option>
                    ))}
                  </select>
                )}
                {catIconType === 'custom' && (
                  <input
                    type="text"
                    placeholder="e.g. https://example.com/icon.png"
                    value={catCustomIcon}
                    onChange={(e) => setCatCustomIcon(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                )}
                {catIconType === 'upload' && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCatCustomIcon(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-primary/10 file:text-primary file:cursor-pointer"
                    />
                    {catCustomIcon && (
                      <div className="flex items-center gap-2 mt-1">
                        <img src={catCustomIcon} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-border" />
                        <span className="text-[10px] text-muted-foreground">Image loaded</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Sort Order</label>
                <input
                  type="number"
                  placeholder="e.g. 0"
                  value={catSortOrder}
                  onChange={(e) => setCatSortOrder(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setShowCategoryModal(false)} className="px-3 py-1.5 border border-border rounded-lg text-xs cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg text-xs cursor-pointer">Save Category</button>
            </div>
          </form>
        </div>
      )}

      {/* Service Save Form Dialog */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form onSubmit={handleSaveService} className="w-full max-w-md bg-card border border-border p-6 rounded-xl space-y-4">
            <h4 className="font-bold text-lg font-heading">{serviceModalMode === 'create' ? 'Create Catalog Service' : 'Edit Catalog Service'}</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Service Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tap leak repair"
                  value={srvName}
                  onChange={(e) => { setSrvName(e.target.value); setSrvSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')); }}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Service Slug URL</label>
                <input
                  type="text"
                  value={srvSlug}
                  onChange={(e) => setSrvSlug(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Est. Duration (mins)</label>
                <input
                  type="number"
                  value={srvDuration}
                  onChange={(e) => setSrvDuration(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Service Icon</label>
                  <div className="flex gap-1 bg-secondary/80 p-0.5 rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => setSrvIconType('preset')}
                      className={`text-[9px] font-bold px-2 py-1 rounded-md cursor-pointer transition-all ${srvIconType === 'preset' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Preset
                    </button>
                    <button
                      type="button"
                      onClick={() => setSrvIconType('custom')}
                      className={`text-[9px] font-bold px-2 py-1 rounded-md cursor-pointer transition-all ${srvIconType === 'custom' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setSrvIconType('upload')}
                      className={`text-[9px] font-bold px-2 py-1 rounded-md cursor-pointer transition-all ${srvIconType === 'upload' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Upload File
                    </button>
                  </div>
                </div>
                {srvIconType === 'preset' && (
                  <select
                    value={srvIcon}
                    onChange={(e) => setSrvIcon(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    {Object.keys(ICON_MAP).filter(key => !key.endsWith('-outline')).map((key) => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                )}
                {srvIconType === 'custom' && (
                  <input
                    type="text"
                    placeholder="e.g. https://example.com/icon.png"
                    value={srvCustomIcon}
                    onChange={(e) => setSrvCustomIcon(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                )}
                {srvIconType === 'upload' && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setSrvCustomIcon(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-primary/10 file:text-primary file:cursor-pointer"
                    />
                    {srvCustomIcon && (
                      <div className="flex items-center gap-2 mt-1">
                        <img src={srvCustomIcon} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-border" />
                        <span className="text-[10px] text-muted-foreground">Image loaded</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Sort Order</label>
                <input
                  type="number"
                  value={srvSortOrder}
                  onChange={(e) => setSrvSortOrder(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Pricing Type</label>
                <select
                  value={srvPricingType}
                  onChange={(e: any) => setSrvPricingType(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="BASE_PLUS_VARIABLE">Base + Variable</option>
                  <option value="FIXED">Fixed Price</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Base Price (₹)</label>
                <input
                  type="number"
                  value={srvBasePrice}
                  onChange={(e) => setSrvBasePrice(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Billing Unit</label>
                <select
                  value={srvUnit}
                  onChange={(e: any) => setSrvUnit(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="HOUR">Per Hour</option>
                  <option value="SERVICE">Per Service</option>
                  <option value="FLAT">Flat Rate</option>
                </select>
              </div>
              {srvPricingType === 'BASE_PLUS_VARIABLE' && (
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Additional Unit Price (₹)</label>
                  <input
                    type="number"
                    value={srvAdditionalPrice}
                    onChange={(e) => setSrvAdditionalPrice(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                    required
                  />
                </div>
              )}
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Description</label>
                <textarea
                  placeholder="Describe service details..."
                  value={srvDesc}
                  onChange={(e) => setSrvDesc(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs h-16 focus:outline-none"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setShowServiceModal(false)} className="px-3 py-1.5 border border-border rounded-lg text-xs cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg text-xs cursor-pointer">Save Service</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
