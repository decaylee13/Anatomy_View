export const BRAIN_REGIONS = {
  'left hemisphere': {
    label: 'Left Hemisphere',
    color: '#ff00ff', // Magenta - distinct from natural brain colors
    aliases: ['left hemisphere', 'left brain', 'left cerebral hemisphere', 'left side'],
    groupPatterns: ['brain_left_hemisphere', 'brainlefthemisphere', 'left_hemisphere']
  },
  'right hemisphere': {
    label: 'Right Hemisphere',
    color: '#00ffff', // Cyan - distinct from natural brain colors
    aliases: ['right hemisphere', 'right brain', 'right cerebral hemisphere', 'right side'],
    groupPatterns: ['brain_right_hemisphere', 'brainrighthemisphere', 'right_hemisphere']
  },
  'brain stem': {
    label: 'Brain Stem',
    color: '#00ff00', // Lime - distinct from natural brain colors
    aliases: ['brain stem', 'brainstem', 'brain_stem', 'stem'],
    groupPatterns: ['brain_stem', 'brainstem']
  },
  'cerebellum': {
    label: 'Cerebellum',
    color: '#8b5cf6', // Purple - distinct from natural brain colors
    aliases: ['cerebellum', 'cerebellar'],
    groupPatterns: ['cerebellum']
  },
  'olfactory nerve': {
    label: 'Olfactory Nerve',
    color: '#ff1493', // Deep pink - distinct from natural brain colors
    aliases: ['olfactory nerve', 'olfactory', 'cranial nerve 1', 'cn1'],
    groupPatterns: ['olfactory_nerve', 'olfactorynerve']
  },
  'stria medullaris': {
    label: 'Stria Medullaris',
    color: '#00ced1', // Dark turquoise - distinct from natural brain colors
    aliases: ['stria medullaris', 'stria mediullari', 'stria'],
    groupPatterns: ['stria_medullari', 'striamedullari']
  }
};

export function resolveBrainRegionName(input) {
  if (!input) return null;
  const compact = input.trim().toLowerCase();
  const normalised = compact.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [key, data] of Object.entries(BRAIN_REGIONS)) {
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
