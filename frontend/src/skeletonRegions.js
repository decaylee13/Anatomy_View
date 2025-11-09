export const SKELETON_REGIONS = {
  'skull': {
    label: 'Skull',
    color: '#ff00ff', // Magenta
    aliases: ['skull', 'cranium', 'head'],
    fileName: 'skull'
  },
  'spine': {
    label: 'Spine',
    color: '#00ffff', // Cyan
    aliases: ['spine', 'vertebrae', 'vertebral column', 'spinal column', 'backbone'],
    fileName: 'spine'
  },
  'rib cage': {
    label: 'Rib Cage',
    color: '#00ff00', // Lime
    aliases: ['rib cage', 'ribs', 'ribcage', 'thoracic cage', 'chest'],
    fileName: 'rib_cage'
  },
  'scapula': {
    label: 'Scapula',
    color: '#8b5cf6', // Purple
    aliases: ['scapula', 'scapulae', 'shoulder blade', 'shoulder blades'],
    fileName: 'scapula'
  },
  'clavicle': {
    label: 'Clavicle',
    color: '#ff1493', // Deep pink
    aliases: ['clavicle', 'clavicles', 'collarbone', 'collar bone'],
    fileName: 'clavicle'
  },
  'pelvis': {
    label: 'Pelvis',
    color: '#00ced1', // Dark turquoise
    aliases: ['pelvis', 'pelvic', 'hip bone', 'hip bones'],
    fileName: 'pelvis'
  },
  'left humerus': {
    label: 'Left Humerus, Ulna & Radius',
    color: '#ffa500', // Orange
    aliases: ['left humerus', 'left ulna', 'left radius', 'left arm bones', 'left upper arm', 'left forearm'],
    fileName: 'left_humerus_ulna_radius'
  },
  'right humerus': {
    label: 'Right Humerus, Ulna & Radius',
    color: '#ffff00', // Yellow
    aliases: ['right humerus', 'right ulna', 'right radius', 'right arm bones', 'right upper arm', 'right forearm'],
    fileName: 'right_humerus_ulna_radius'
  },
  'left hand': {
    label: 'Left Hand',
    color: '#ff69b4', // Hot pink
    aliases: ['left hand', 'left fingers', 'left metacarpals', 'left phalanges'],
    fileName: 'left_hand'
  },
  'right hand': {
    label: 'Right Hand',
    color: '#87ceeb', // Sky blue
    aliases: ['right hand', 'right fingers', 'right metacarpals', 'right phalanges'],
    fileName: 'right_hand'
  },
  'left femur': {
    label: 'Left Femur',
    color: '#98fb98', // Pale green
    aliases: ['left femur', 'left thigh bone', 'left thighbone'],
    fileName: 'left_femur'
  },
  'right femur': {
    label: 'Right Femur',
    color: '#dda0dd', // Plum
    aliases: ['right femur', 'right thigh bone', 'right thighbone'],
    fileName: 'right_femur'
  },
  'left patella': {
    label: 'Left Patella',
    color: '#f0e68c', // Khaki
    aliases: ['left patella', 'left kneecap', 'left knee cap'],
    fileName: 'left_patella'
  },
  'right patella': {
    label: 'Right Patella',
    color: '#e0ffff', // Light cyan
    aliases: ['right patella', 'right kneecap', 'right knee cap'],
    fileName: 'right_patella'
  },
  'left tibia': {
    label: 'Left Fibula & Tibia',
    color: '#ffb6c1', // Light pink
    aliases: ['left tibia', 'left fibula', 'left shin bone', 'left shinbone', 'left lower leg'],
    fileName: 'left_fibula_tibia'
  },
  'right tibia': {
    label: 'Right Fibula & Tibia',
    color: '#ffd700', // Gold
    aliases: ['right tibia', 'right fibula', 'right shin bone', 'right shinbone', 'right lower leg'],
    fileName: 'right_fibula_tibia'
  },
  'left foot': {
    label: 'Left Foot',
    color: '#adff2f', // Green yellow
    aliases: ['left foot', 'left toes', 'left tarsals', 'left metatarsals'],
    fileName: 'left_foot'
  },
  'right foot': {
    label: 'Right Foot',
    color: '#ff6347', // Tomato
    aliases: ['right foot', 'right toes', 'right tarsals', 'right metatarsals'],
    fileName: 'right_foot'
  }
};

// Helper to find region by any alias
export function findRegionByName(name) {
  const lowerName = name.toLowerCase();
  for (const [key, region] of Object.entries(SKELETON_REGIONS)) {
    if (region.aliases.some(alias => lowerName.includes(alias))) {
      return { key, ...region };
    }
  }
  return null;
}
