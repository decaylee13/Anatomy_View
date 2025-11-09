export const HEART_REGIONS = {
  'left atrium': {
    label: 'Left Atrium',
    position: [-0.55, 0.55, -0.05],
    color: '#38bdf8',
    aliases: ['left atrium', 'left atrial chamber', 'la'],
    materialPatterns: ['l_atrium', 'latrium', 'left_atrium', 'atrium_left', 'atrial_left']
  },
  'right atrium': {
    label: 'Right Atrium',
    position: [0.55, 0.55, -0.05],
    color: '#f97316',
    aliases: ['right atrium', 'right atrial chamber', 'ra'],
    materialPatterns: ['r_atrium', 'ratrium', 'right_atrium', 'atrium_right', 'atrial_right']
  },
  'left ventricle': {
    label: 'Left Ventricle',
    position: [-0.45, -0.2, 0.25],
    color: '#22d3ee',
    aliases: ['left ventricle', 'lv'],
    materialPatterns: ['ventricles1', 'ventricles', 'leftventricle', 'left_ventricle', 'ventricle_left', 'ventricular_left']
  },
  'right ventricle': {
    label: 'Right Ventricle',
    position: [0.45, -0.2, 0.25],
    color: '#facc15',
    aliases: ['right ventricle', 'rv'],
    materialPatterns: ['ventricles1', 'ventricles', 'rightventricle', 'right_ventricle', 'ventricle_right', 'ventricular_right']
  },
  'aorta': {
    label: 'Aorta',
    position: [0.1, 0.8, -0.25],
    color: '#ef4444',
    aliases: ['aorta', 'ascending aorta'],
    materialPatterns: ['aortal', 'aorta', 'aortic']
  },
  'pulmonary trunk': {
    label: 'Pulmonary Trunk',
    position: [-0.2, 0.75, 0.35],
    color: '#8b5cf6',
    aliases: ['pulmonary trunk', 'pulmonary artery', 'main pulmonary artery'],
    materialPatterns: ['artery', 'pulmonary', 'pulmonarytrunk', 'pulmonary_trunk']
  },
  'veins': {
    label: 'Veins',
    position: [0.3, 0.6, -0.4],
    color: '#3b82f6',
    aliases: ['veins', 'venous system', 'pulmonary veins', 'vena cava'],
    materialPatterns: ['veins', 'vein', 'venous']
  },
  'arteries': {
    label: 'Arteries',
    position: [-0.2, 0.75, 0.35],
    color: '#dc2626',
    aliases: ['arteries', 'arterial system', 'pulmonary arteries'],
    materialPatterns: ['artery', 'arteries', 'arterial']
  }
};

export function resolveHeartRegionName(input) {
  if (!input) return null;
  const compact = input.trim().toLowerCase();
  const normalised = compact.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [key, data] of Object.entries(HEART_REGIONS)) {
    const keyMatch = key === normalised || key === compact;
    if (keyMatch) return { key, data };
    if (data.aliases?.some((alias) => {
      const aliasNormalised = alias.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
      return aliasNormalised === normalised || alias === compact;
    })) {
      return { key, data };
    }
  }
  return null;
}
