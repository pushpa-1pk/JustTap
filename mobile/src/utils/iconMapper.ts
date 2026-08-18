import { ImageSourcePropType } from 'react-native';

export const CLAY_ICONS: Record<string, ImageSourcePropType> = {
  // Categories slugs or custom icon names
  'home-services': require('../../assets/images/3d-icons/3d_cleaning_home.jpg'),
  'beauty-personal-care': require('../../assets/images/3d-icons/3d_salon_women.jpg'),
  'cleaning-sanitation': require('../../assets/images/3d-icons/3d_cleaning_home.jpg'),
  
  // Services names or custom icon names
  'salon for women': require('../../assets/images/3d-icons/3d_salon_women.jpg'),
  'electrician': require('../../assets/images/3d-icons/3d_electrician.jpg'),
  'home cleaning': require('../../assets/images/3d-icons/3d_cleaning_home.jpg'),
  'deep cleaning': require('../../assets/images/3d-icons/3d_cleaning_home.jpg'),
  'bathroom cleaning': require('../../assets/images/3d-icons/3d_cleaning_home.jpg'),
  'kitchen cleaning': require('../../assets/images/3d-icons/3d_cleaning_home.jpg'),
  'sofa cleaning': require('../../assets/images/3d-icons/3d_cleaning_home.jpg'),
  'carpet cleaning': require('../../assets/images/3d-icons/3d_cleaning_home.jpg'),
};

export const getClayIcon = (iconNameOrSlug: string | undefined): ImageSourcePropType | null => {
  if (!iconNameOrSlug) return null;
  
  const key = iconNameOrSlug.toLowerCase().trim();
  
  if (CLAY_ICONS[key]) return CLAY_ICONS[key];
  
  // Try case-insensitive search on keys
  for (const [k, value] of Object.entries(CLAY_ICONS)) {
    if (k.toLowerCase() === key) {
      return value;
    }
  }
  
  return null;
};
