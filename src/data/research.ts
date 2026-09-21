import { PaperData } from '../components/Research/types';

// Tag vocabulary. Add new tags here; a typo in a paper's tags fails type-check.
export const researchTags = ['Energy Markets', 'Data-Driven Control'] as const;
export type ResearchTag = (typeof researchTags)[number];

export const papers: PaperData<ResearchTag>[] = [
  {
    title: 'Proactive Electricity Markets',
    authors: 'Kai Zhang, Nicolas Lanzetti, Florian Dörfler, Keith Moffat',
    tags: ['Energy Markets'],
    status: 'Working Paper',
    links: [
      {
        link: '/files/master_thesis_stochastic_electricity_markets.pdf',
        text: 'Master Thesis',
      },
      {
        link: 'https://svorasro.wordpress.com/2025/07/07/congratulations-to-kai-zhang-on-receiving-the-2025-svor-masters-thesis-award/',
        text: 'SVOR Best Master Thesis Award 2025',
      },
    ],
  },
  {
    title: 'Data-Enabled Predictive Iterative Control',
    authors: 'Kai Zhang, Riccardo Zuliani, Efe C. Balta, John Lygeros',
    tags: ['Data-Driven Control'],
    journal: 'IEEE Control Systems Letters',
    year: 2024,
    links: [
      {
        link: 'https://doi.org/10.1109/LCSYS.2024.3408073',
        text: '10.1109/LCSYS.2024.3408073',
      },
    ],
  },
  {
    title: 'Data-Enabled Predictive Control for Dynamic Traffic Routing',
    authors:
      'Kai Zhang, Kenan Zhang, Linbin Huang, Giuseppe Belgioioso, John Lygeros, Florian Dörfler',
    tags: ['Data-Driven Control'],
    journal: 'TRB Annual Meeting',
    year: 2024,
    links: [
      {
        link: 'https://www.research-collection.ethz.ch/bitstream/handle/20.500.11850/719197/6/23_Zhang_TRBAM_DeePC-routing.pdf',
        text: 'ETH Zurich Research Collection',
      },
    ],
  },
];
