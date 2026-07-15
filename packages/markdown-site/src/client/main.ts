// The page chrome, shipped inline in every rendered page as one bundle. Each
// behavior activates only when its markup is present, so a searchless or
// toc-less page carries the code but never wires it up.
import './styles/page.css';
import './styles/toc.css';
import './styles/search.css';

import { initCopyMarkdown } from './copy-markdown';
import { initLightbox } from './lightbox';
import { initSearch } from './search';
import { initSections } from './sections';
import { initTheme } from './theme';
import { initToc } from './toc';

initTheme();
initSections();
initCopyMarkdown();
initLightbox();
if (document.querySelector('.toc')) initToc();
if (document.querySelector('.search-dialog')) initSearch();
