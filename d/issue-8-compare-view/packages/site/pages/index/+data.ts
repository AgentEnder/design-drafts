import type { PageContextServer } from 'vike/types';
import type { BranchEntry } from '../+onCreateGlobalContext.server.js';

export type IndexData = {
  branches: BranchEntry[];
};

export function data(pageContext: PageContextServer): IndexData {
  return {
    branches: pageContext.globalContext.branches,
  };
}
