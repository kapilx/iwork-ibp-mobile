export interface TileColorDefinition {
    key: string;
    label: string;
    swatchColor: string;
    soft: { background: string; borderColor: string; headingColor: string };
    vivid: { background: string; textColor: string };
}

// Admin picks a colour key; the tile preview (and IBP render, later) derives
// its look from here — the exact key (not the CSS) is what's persisted in
// the saved WellnessCard JSON, so this map is the single source of truth for
// what each key renders as. "soft" powers Section A's pastel stat tiles,
// "vivid" powers Section C's bold gradient tiles.
export const TILE_COLOR_TEMPLATES: TileColorDefinition[] = [
    {
        key: 'purple',
        label: 'Purple',
        swatchColor: '#7C6BF5',
        soft: {
            background: 'linear-gradient(180deg, #FDFCFF 0%, #ECE4FF 100%)',
            borderColor: '#CFC0F4',
            headingColor: '#5B4BE0',
        },
        vivid: { background: 'linear-gradient(135deg, #5B4BE0 0%, #7C6BF5 100%)', textColor: '#FFFFFF' },
    },
    {
        key: 'orange',
        label: 'Orange',
        swatchColor: '#F4A94C',
        soft: {
            background: 'linear-gradient(180deg, #FFFEFB 0%, #FFE9CE 100%)',
            borderColor: '#F4D3A4',
            headingColor: '#C2712B',
        },
        vivid: { background: 'linear-gradient(135deg, #E8963C 0%, #F4B968 100%)', textColor: '#FFFFFF' },
    },
    {
        key: 'green',
        label: 'Green',
        swatchColor: '#34C08A',
        soft: {
            background: 'linear-gradient(180deg, #FCFFFD 0%, #D9F6E7 100%)',
            borderColor: '#ABE3C8',
            headingColor: '#0FA36B',
        },
        vivid: { background: 'linear-gradient(135deg, #0FA36B 0%, #34C08A 100%)', textColor: '#FFFFFF' },
    },
    {
        key: 'red',
        label: 'Red',
        swatchColor: '#F7857E',
        soft: {
            background: 'linear-gradient(180deg, #FFFDFC 0%, #FBE0DD 100%)',
            borderColor: '#F4BCB7',
            headingColor: '#F0596B',
        },
        vivid: { background: 'linear-gradient(135deg, #F0596B 0%, #F7857E 100%)', textColor: '#FFFFFF' },
    },
    {
        key: 'blue',
        label: 'Blue',
        swatchColor: '#46A7F0',
        soft: {
            background: 'linear-gradient(180deg, #FBFDFF 0%, #DCEEFC 100%)',
            borderColor: '#B7DBF7',
            headingColor: '#1E7FD6',
        },
        vivid: { background: 'linear-gradient(135deg, #1E7FD6 0%, #46A7F0 100%)', textColor: '#FFFFFF' },
    },
];

export const getTileColorTemplate = (key?: string): TileColorDefinition =>
    TILE_COLOR_TEMPLATES.find((template) => template.key === key) ?? TILE_COLOR_TEMPLATES[0];
