export const HEART_REGIONS = {
  'left atrium': {
    label: 'Left Atrium',
    position: [-0.55, 0.55, -0.05],
    color: '#38bdf8',
    aliases: ['left atrium', 'left atrial chamber', 'la']
  },
  'right atrium': {
    label: 'Right Atrium',
    position: [0.55, 0.55, -0.05],
    color: '#f97316',
    aliases: ['right atrium', 'right atrial chamber', 'ra']
  },
  'left ventricle': {
    label: 'Left Ventricle',
    position: [-0.45, -0.2, 0.25],
    color: '#22d3ee',
    aliases: ['left ventricle', 'lv']
  },
  'right ventricle': {
    label: 'Right Ventricle',
    position: [0.45, -0.2, 0.25],
    color: '#facc15',
    aliases: ['right ventricle', 'rv']
  },
  'aorta': {
    label: 'Aorta',
    position: [0.1, 0.8, -0.25],
    color: '#ef4444',
    aliases: ['aorta', 'ascending aorta']
  },
  'pulmonary trunk': {
    label: 'Pulmonary Trunk',
    position: [-0.2, 0.75, 0.35],
    color: '#8b5cf6',
    aliases: ['pulmonary trunk', 'pulmonary artery', 'main pulmonary artery']
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
