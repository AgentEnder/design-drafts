const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/entries/pages_-legal-_data-deletion.gk3QS2Gk.js","assets/chunks/chunk-Sg1e8hzK.js","assets/chunks/chunk-B4KANbCb.js","assets/chunks/chunk-GZCHJOCC.js","assets/chunks/chunk-DnPPvupd.js","assets/chunks/chunk-q44vHeK4.js","assets/static/style-8ab7a3e7.BcWtY8Ol.css","assets/static/Layout.CKvvAW2y.css","assets/static/PageShell.DxmYwmR5.css","assets/entries/pages_-legal-_privacy.2QzJxx4n.js","assets/entries/pages_error.icogevXY.js","assets/chunks/chunk-Cvio2paI.js","assets/chunks/chunk-DDMcs2jv.js","assets/static/Layout.6EJ3Jvhe.css","assets/entries/pages_index.Cz_2Fmup.js","assets/entries/pages_presentations_index.Dj-RYGf7.js","assets/chunks/chunk-CIV5sg3E.js","assets/static/src.B8dU2LIX.css","assets/chunks/chunk-CuqJYWKL.js","assets/static/content-marker.DtkiqZQZ.css","assets/chunks/chunk-kt2gQlqv.js","assets/static/index.C8hEtJyE.css","assets/entries/pages_projects.DXHV4gcX.js","assets/chunks/chunk-Ckj67tQv.js","assets/static/projects.PhaZSyLi.css","assets/entries/pages_tools.B9D-nCWv.js","assets/static/tools.JqAhRSVc.css","assets/entries/pages_blog_index.SyInMClH.js","assets/chunks/chunk-D0XqqxM7.js","assets/static/src.BMEKT8K_.css","assets/static/index.DAdfchXB.css","assets/entries/pages_blog_view.hS3fhJrq.js","assets/static/view.CRa8bKWA.css","assets/entries/pages_presentations_view.B1zL3FS5.js"])))=>i.map(i=>d[i]);
import { n as __exportAll } from "./chunk-Sg1e8hzK.js";
import { a as scrollToHashOrTop, b as getGlobalObject, c as onPopStateBegin, d as isHrefCurrentUrl, f as isLinkIgnored, g as catchInfiniteLoop, h as setVirtualFileExportsGlobalEntry, i as autoSaveScrollPosition, l as initLinkPrefetchHandlers, n as renderPageClient, o as setScrollPosition, p as isLinkSkipped, r as scrollRestoration_init, s as initHistory, t as getRenderCount, v as assert } from "./chunk-DnPPvupd.js";
import { t as __vitePreload } from "./chunk-DDMcs2jv.js";
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/initOnPopState.js
function initOnPopState() {
	window.addEventListener("popstate", onPopState);
}
async function onPopState() {
	catchInfiniteLoop("onPopState()");
	const res = onPopStateBegin();
	if (res.skip) return;
	const { previous, current } = res;
	await handleHistoryNavigation(previous, current);
}
async function handleHistoryNavigation(previous, current) {
	const scrollTarget = current.state.vike.scrollPosition || void 0;
	if (removeHash(current.url) === removeHash(previous.url) && current.url !== previous.url) {
		setScrollPosition(scrollTarget);
		return;
	}
	const doNotRenderIfSamePage = current.state.vike.triggeredBy === "user" || previous.state.vike.triggeredBy === "user";
	await renderPageClient({
		scrollTarget,
		isBackwardNavigation: !current.state.vike.timestamp || !previous.state.vike.timestamp ? null : current.state.vike.timestamp < previous.state.vike.timestamp,
		doNotRenderIfSamePage,
		isHistoryNavigation: true
	});
}
function removeHash(url) {
	return url.split("#")[0];
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/initOnLinkClick.js
function initOnLinkClick() {
	document.addEventListener("click", onLinkClick);
}
async function onLinkClick(ev) {
	if (!isNormalLeftClick(ev)) return;
	const linkTag = findLinkTag(ev.target);
	if (!linkTag) return;
	const href = linkTag.getAttribute("href");
	if (href === null) return;
	if (isLinkIgnored(linkTag)) return;
	if (href.includes("#") && isHrefCurrentUrl(href)) {
		ev.preventDefault();
		scrollToHashOrTop(href.split("#")[1]);
		return;
	}
	if (isLinkSkipped(linkTag)) return;
	ev.preventDefault();
	let scrollTarget;
	{
		const v = linkTag.getAttribute("keep-scroll-position");
		if (v !== null) scrollTarget = { preserveScroll: v === "false" ? false : true };
	}
	await renderPageClient({
		scrollTarget,
		urlOriginal: href
	});
}
function isNormalLeftClick(ev) {
	return ev.button === 0 && !ev.ctrlKey && !ev.shiftKey && !ev.altKey && !ev.metaKey;
}
function findLinkTag(target) {
	while (target.tagName !== "A") {
		const { parentNode } = target;
		if (!parentNode) return null;
		target = parentNode;
	}
	return target;
}
//#endregion
//#region pages/blog/index/+route.ts
var _route_exports$2 = /* @__PURE__ */ __exportAll({ default: () => _route_default$2 });
var _route_default$2 = "/blog/@pageNumber";
//#endregion
//#region pages/blog/view/+route.ts
var _route_exports$1 = /* @__PURE__ */ __exportAll({ default: () => _route_default$1 });
var _route_default$1 = "/blog/@date/@slug";
//#endregion
//#region pages/presentations/view/+route.ts
var _route_exports = /* @__PURE__ */ __exportAll({ default: () => _route_default });
var _route_default = "/presentations/view/@presentation";
//#endregion
//#region \0virtual:vike:global-entry:client:client-routing
var _virtual_vike_global_entry_client_client_routing_exports = /* @__PURE__ */ __exportAll({
	neverLoaded: () => neverLoaded,
	pageConfigGlobalSerialized: () => pageConfigGlobalSerialized,
	pageConfigsSerialized: () => pageConfigsSerialized,
	pageFilesEager: () => pageFilesEager,
	pageFilesExportNamesEager: () => pageFilesExportNamesEager,
	pageFilesExportNamesLazy: () => pageFilesExportNamesLazy,
	pageFilesLazy: () => pageFilesLazy,
	pageFilesList: () => pageFilesList
});
var pageFilesLazy = {};
var pageFilesEager = {};
var pageFilesExportNamesLazy = {};
var pageFilesExportNamesEager = {};
var pageFilesList = [];
var neverLoaded = {};
var pageConfigsSerialized = [
	{
		pageId: "/pages/(legal)/data-deletion",
		isErrorPage: void 0,
		routeFilesystem: {
			"routeString": "/data-deletion",
			"definedAtLocation": "/pages/(legal)/data-deletion/"
		},
		loadVirtualFilePageEntry: () => ({
			moduleId: "virtual:vike:page-entry:client:/pages/(legal)/data-deletion",
			moduleExportsPromise: __vitePreload(() => import("../entries/pages_-legal-_data-deletion.gk3QS2Gk.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8]))
		}),
		configValuesSerialized: {
			["hasServerOnlyHook"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: false
				}
			},
			["isClientRuntimeLoaded"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			},
			["onBeforeRenderEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["dataEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["guardEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["clientRouting"]: {
				type: "standard",
				definedAtData: {
					"filePathToShowToUser": "/pages/+config.ts",
					"fileExportPathToShowToUser": ["default", "clientRouting"]
				},
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			}
		}
	},
	{
		pageId: "/pages/(legal)/privacy",
		isErrorPage: void 0,
		routeFilesystem: {
			"routeString": "/privacy",
			"definedAtLocation": "/pages/(legal)/privacy/"
		},
		loadVirtualFilePageEntry: () => ({
			moduleId: "virtual:vike:page-entry:client:/pages/(legal)/privacy",
			moduleExportsPromise: __vitePreload(() => import("../entries/pages_-legal-_privacy.2QzJxx4n.js"), __vite__mapDeps([9,1,2,3,4,5,6,7,8]))
		}),
		configValuesSerialized: {
			["hasServerOnlyHook"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: false
				}
			},
			["isClientRuntimeLoaded"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			},
			["onBeforeRenderEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["dataEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["guardEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["clientRouting"]: {
				type: "standard",
				definedAtData: {
					"filePathToShowToUser": "/pages/+config.ts",
					"fileExportPathToShowToUser": ["default", "clientRouting"]
				},
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			}
		}
	},
	{
		pageId: "/pages/_error",
		isErrorPage: true,
		routeFilesystem: void 0,
		loadVirtualFilePageEntry: () => ({
			moduleId: "virtual:vike:page-entry:client:/pages/_error",
			moduleExportsPromise: __vitePreload(() => import("../entries/pages_error.icogevXY.js"), __vite__mapDeps([10,1,11,12,3,4,5,6,13,8]))
		}),
		configValuesSerialized: {
			["hasServerOnlyHook"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: false
				}
			},
			["isClientRuntimeLoaded"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			},
			["onBeforeRenderEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["dataEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["guardEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["clientRouting"]: {
				type: "standard",
				definedAtData: {
					"filePathToShowToUser": "/pages/+config.ts",
					"fileExportPathToShowToUser": ["default", "clientRouting"]
				},
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			}
		}
	},
	{
		pageId: "/pages/index",
		isErrorPage: void 0,
		routeFilesystem: {
			"routeString": "/",
			"definedAtLocation": "/pages/index/"
		},
		loadVirtualFilePageEntry: () => ({
			moduleId: "virtual:vike:page-entry:client:/pages/index",
			moduleExportsPromise: __vitePreload(() => import("../entries/pages_index.Cz_2Fmup.js"), __vite__mapDeps([14,1,11,12,3,4,5,6,13,8]))
		}),
		configValuesSerialized: {
			["hasServerOnlyHook"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: false
				}
			},
			["isClientRuntimeLoaded"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			},
			["onBeforeRenderEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["dataEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["guardEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["clientRouting"]: {
				type: "standard",
				definedAtData: {
					"filePathToShowToUser": "/pages/+config.ts",
					"fileExportPathToShowToUser": ["default", "clientRouting"]
				},
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			}
		}
	},
	{
		pageId: "/pages/presentations/index",
		isErrorPage: void 0,
		routeFilesystem: {
			"routeString": "/presentations",
			"definedAtLocation": "/pages/presentations/index/"
		},
		loadVirtualFilePageEntry: () => ({
			moduleId: "virtual:vike:page-entry:client:/pages/presentations/index",
			moduleExportsPromise: __vitePreload(() => import("../entries/pages_presentations_index.Dj-RYGf7.js"), __vite__mapDeps([15,1,16,12,5,17,11,3,4,6,13,8,18,19,20,21]))
		}),
		configValuesSerialized: {
			["hasServerOnlyHook"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: false
				}
			},
			["isClientRuntimeLoaded"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			},
			["onBeforeRenderEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["dataEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["guardEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["clientRouting"]: {
				type: "standard",
				definedAtData: {
					"filePathToShowToUser": "/pages/+config.ts",
					"fileExportPathToShowToUser": ["default", "clientRouting"]
				},
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			}
		}
	},
	{
		pageId: "/pages/projects",
		isErrorPage: void 0,
		routeFilesystem: {
			"routeString": "/projects",
			"definedAtLocation": "/pages/projects/"
		},
		loadVirtualFilePageEntry: () => ({
			moduleId: "virtual:vike:page-entry:client:/pages/projects",
			moduleExportsPromise: __vitePreload(() => import("../entries/pages_projects.DXHV4gcX.js"), __vite__mapDeps([22,1,11,12,3,4,5,6,13,8,18,19,20,23,24]))
		}),
		configValuesSerialized: {
			["hasServerOnlyHook"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			},
			["isClientRuntimeLoaded"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			},
			["onBeforeRenderEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["dataEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: { "server": true }
				}
			},
			["guardEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["clientRouting"]: {
				type: "standard",
				definedAtData: {
					"filePathToShowToUser": "/pages/+config.ts",
					"fileExportPathToShowToUser": ["default", "clientRouting"]
				},
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			}
		}
	},
	{
		pageId: "/pages/tools",
		isErrorPage: void 0,
		routeFilesystem: {
			"routeString": "/tools",
			"definedAtLocation": "/pages/tools/"
		},
		loadVirtualFilePageEntry: () => ({
			moduleId: "virtual:vike:page-entry:client:/pages/tools",
			moduleExportsPromise: __vitePreload(() => import("../entries/pages_tools.B9D-nCWv.js"), __vite__mapDeps([25,1,11,12,3,4,5,6,13,8,23,26]))
		}),
		configValuesSerialized: {
			["hasServerOnlyHook"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			},
			["isClientRuntimeLoaded"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			},
			["onBeforeRenderEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["dataEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: { "server": true }
				}
			},
			["guardEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["clientRouting"]: {
				type: "standard",
				definedAtData: {
					"filePathToShowToUser": "/pages/+config.ts",
					"fileExportPathToShowToUser": ["default", "clientRouting"]
				},
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			}
		}
	},
	{
		pageId: "/pages/blog/index",
		isErrorPage: void 0,
		routeFilesystem: {
			"routeString": "/blog",
			"definedAtLocation": "/pages/blog/index/"
		},
		loadVirtualFilePageEntry: () => ({
			moduleId: "virtual:vike:page-entry:client:/pages/blog/index",
			moduleExportsPromise: __vitePreload(() => import("../entries/pages_blog_index.SyInMClH.js"), __vite__mapDeps([27,1,11,12,3,4,5,6,13,8,28,29,20,30]))
		}),
		configValuesSerialized: {
			["hasServerOnlyHook"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			},
			["isClientRuntimeLoaded"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			},
			["onBeforeRenderEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["dataEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: { "server": true }
				}
			},
			["guardEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["route"]: {
				type: "standard",
				definedAtData: {
					"filePathToShowToUser": "/pages/blog/index/+route.ts",
					"fileExportPathToShowToUser": []
				},
				valueSerialized: {
					type: "plus-file",
					exportValues: _route_exports$2
				}
			},
			["clientRouting"]: {
				type: "standard",
				definedAtData: {
					"filePathToShowToUser": "/pages/+config.ts",
					"fileExportPathToShowToUser": ["default", "clientRouting"]
				},
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			}
		}
	},
	{
		pageId: "/pages/blog/view",
		isErrorPage: void 0,
		routeFilesystem: {
			"routeString": "/blog/view",
			"definedAtLocation": "/pages/blog/view/"
		},
		loadVirtualFilePageEntry: () => ({
			moduleId: "virtual:vike:page-entry:client:/pages/blog/view",
			moduleExportsPromise: __vitePreload(() => import("../entries/pages_blog_view.hS3fhJrq.js"), __vite__mapDeps([31,1,11,12,3,4,5,6,13,8,18,19,28,29,20,32]))
		}),
		configValuesSerialized: {
			["hasServerOnlyHook"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			},
			["isClientRuntimeLoaded"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			},
			["onBeforeRenderEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["dataEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: { "server": true }
				}
			},
			["guardEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["route"]: {
				type: "standard",
				definedAtData: {
					"filePathToShowToUser": "/pages/blog/view/+route.ts",
					"fileExportPathToShowToUser": []
				},
				valueSerialized: {
					type: "plus-file",
					exportValues: _route_exports$1
				}
			},
			["clientRouting"]: {
				type: "standard",
				definedAtData: {
					"filePathToShowToUser": "/pages/+config.ts",
					"fileExportPathToShowToUser": ["default", "clientRouting"]
				},
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			}
		}
	},
	{
		pageId: "/pages/presentations/view",
		isErrorPage: void 0,
		routeFilesystem: {
			"routeString": "/presentations/view",
			"definedAtLocation": "/pages/presentations/view/"
		},
		loadVirtualFilePageEntry: () => ({
			moduleId: "virtual:vike:page-entry:client:/pages/presentations/view",
			moduleExportsPromise: __vitePreload(() => import("../entries/pages_presentations_view.B1zL3FS5.js"), __vite__mapDeps([33,1,16,12,5,17,3,4,6]))
		}),
		configValuesSerialized: {
			["hasServerOnlyHook"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: false
				}
			},
			["isClientRuntimeLoaded"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			},
			["onBeforeRenderEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["dataEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["guardEnv"]: {
				type: "computed",
				definedAtData: null,
				valueSerialized: {
					type: "js-serialized",
					value: null
				}
			},
			["route"]: {
				type: "standard",
				definedAtData: {
					"filePathToShowToUser": "/pages/presentations/view/+route.ts",
					"fileExportPathToShowToUser": []
				},
				valueSerialized: {
					type: "plus-file",
					exportValues: _route_exports
				}
			},
			["clientRouting"]: {
				type: "standard",
				definedAtData: {
					"filePathToShowToUser": "/pages/+config.ts",
					"fileExportPathToShowToUser": ["default", "clientRouting"]
				},
				valueSerialized: {
					type: "js-serialized",
					value: true
				}
			}
		}
	}
];
var pageConfigGlobalSerialized = { configValuesSerialized: {} };
pageFilesLazy[".page"] = { .../* @__PURE__ */ Object.assign({}) };
pageFilesExportNamesEager[".page"] = { .../* @__PURE__ */ Object.assign({}) };
pageFilesExportNamesEager[".page.server"] = { .../* @__PURE__ */ Object.assign({}) };
pageFilesEager[".page.route"] = { .../* @__PURE__ */ Object.assign({}) };
pageFilesLazy[".page.client"] = { .../* @__PURE__ */ Object.assign({}) };
pageFilesExportNamesEager[".page.client"] = { .../* @__PURE__ */ Object.assign({}) };
neverLoaded[".page.server"] = { .../* @__PURE__ */ Object.assign({}) };
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/initClientRouter.js
var globalObject = getGlobalObject("initClientRouter.ts", {});
function initClientRouter() {
	setVirtualFileExportsGlobalEntry(_virtual_vike_global_entry_client_client_routing_exports);
	if (globalObject.done) return;
	globalObject.done = true;
	initHistoryAndScroll();
	renderFirstPage();
	initOnLinkClick();
	initLinkPrefetchHandlers();
}
function renderFirstPage() {
	assert(getRenderCount() === 0);
	renderPageClient({
		scrollTarget: { preserveScroll: true },
		isClientSideNavigation: false
	});
}
function initHistoryAndScroll() {
	scrollRestoration_init();
	initHistory();
	autoSaveScrollPosition();
	initOnPopState();
}
//#endregion
export { initClientRouter as t };
