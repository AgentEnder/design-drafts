import vikeReact from 'vike-react/config';
import type { Config } from 'vike/types';

const config: Config = {
  title: 'Design Drafts',
  description: 'Preview index for design draft branches',
  prerender: true,
  passToClient: ['branches'],
  extends: [vikeReact],
};

export default config;
