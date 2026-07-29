const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/chunks/chunk-DaOsTb29.js","assets/chunks/chunk-Sg1e8hzK.js","assets/chunks/chunk-CIV5sg3E.js","assets/chunks/chunk-DDMcs2jv.js","assets/chunks/chunk-q44vHeK4.js","assets/static/src.B8dU2LIX.css","assets/chunks/chunk-D75HMlU4.js","assets/chunks/chunk-DnPPvupd.js"])))=>i.map(i=>d[i]);
import { n as __exportAll, r as __toESM } from "./chunk-Sg1e8hzK.js";
import { r as usePageContext } from "./chunk-GZCHJOCC.js";
import { n as require_react, t as require_jsx_runtime } from "./chunk-q44vHeK4.js";
/* empty css               */
import { t as __vitePreload } from "./chunk-DDMcs2jv.js";
//#region ../../node_modules/.pnpm/react-icons@5.5.0_react@19.1.1/node_modules/react-icons/lib/iconContext.mjs
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var DefaultContext = {
	color: void 0,
	size: void 0,
	className: void 0,
	style: void 0,
	attr: void 0
};
var IconContext = import_react.createContext && /* @__PURE__ */ import_react.createContext(DefaultContext);
//#endregion
//#region ../../node_modules/.pnpm/react-icons@5.5.0_react@19.1.1/node_modules/react-icons/lib/iconBase.mjs
var _excluded = [
	"attr",
	"size",
	"title"
];
function _objectWithoutProperties(source, excluded) {
	if (source == null) return {};
	var target = _objectWithoutPropertiesLoose(source, excluded);
	var key, i;
	if (Object.getOwnPropertySymbols) {
		var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
		for (i = 0; i < sourceSymbolKeys.length; i++) {
			key = sourceSymbolKeys[i];
			if (excluded.indexOf(key) >= 0) continue;
			if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
			target[key] = source[key];
		}
	}
	return target;
}
function _objectWithoutPropertiesLoose(source, excluded) {
	if (source == null) return {};
	var target = {};
	for (var key in source) if (Object.prototype.hasOwnProperty.call(source, key)) {
		if (excluded.indexOf(key) >= 0) continue;
		target[key] = source[key];
	}
	return target;
}
function _extends() {
	_extends = Object.assign ? Object.assign.bind() : function(target) {
		for (var i = 1; i < arguments.length; i++) {
			var source = arguments[i];
			for (var key in source) if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
		}
		return target;
	};
	return _extends.apply(this, arguments);
}
function ownKeys(e, r) {
	var t = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var o = Object.getOwnPropertySymbols(e);
		r && (o = o.filter(function(r) {
			return Object.getOwnPropertyDescriptor(e, r).enumerable;
		})), t.push.apply(t, o);
	}
	return t;
}
function _objectSpread(e) {
	for (var r = 1; r < arguments.length; r++) {
		var t = null != arguments[r] ? arguments[r] : {};
		r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
			_defineProperty(e, r, t[r]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
			Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
		});
	}
	return e;
}
function _defineProperty(obj, key, value) {
	key = _toPropertyKey(key);
	if (key in obj) Object.defineProperty(obj, key, {
		value,
		enumerable: true,
		configurable: true,
		writable: true
	});
	else obj[key] = value;
	return obj;
}
function _toPropertyKey(t) {
	var i = _toPrimitive(t, "string");
	return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive(t, r) {
	if ("object" != typeof t || !t) return t;
	var e = t[Symbol.toPrimitive];
	if (void 0 !== e) {
		var i = e.call(t, r || "default");
		if ("object" != typeof i) return i;
		throw new TypeError("@@toPrimitive must return a primitive value.");
	}
	return ("string" === r ? String : Number)(t);
}
function Tree2Element(tree) {
	return tree && tree.map((node, i) => /* @__PURE__ */ import_react.createElement(node.tag, _objectSpread({ key: i }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
	return (props) => /* @__PURE__ */ import_react.createElement(IconBase, _extends({ attr: _objectSpread({}, data.attr) }, props), Tree2Element(data.child));
}
function IconBase(props) {
	var elem = (conf) => {
		var { attr, size, title } = props, svgProps = _objectWithoutProperties(props, _excluded);
		var computedSize = size || conf.size || "1em";
		var className;
		if (conf.className) className = conf.className;
		if (props.className) className = (className ? className + " " : "") + props.className;
		return /* @__PURE__ */ import_react.createElement("svg", _extends({
			stroke: "currentColor",
			fill: "currentColor",
			strokeWidth: "0"
		}, conf.attr, attr, svgProps, {
			className,
			style: _objectSpread(_objectSpread({ color: props.color || conf.color }, conf.style), props.style),
			height: computedSize,
			width: computedSize,
			xmlns: "http://www.w3.org/2000/svg"
		}), title && /* @__PURE__ */ import_react.createElement("title", null, title), props.children);
	};
	return IconContext !== void 0 ? /* @__PURE__ */ import_react.createElement(IconContext.Consumer, null, (conf) => elem(conf)) : elem(DefaultContext);
}
//#endregion
//#region ../../node_modules/.pnpm/react-icons@5.5.0_react@19.1.1/node_modules/react-icons/fa/index.mjs
function FaGithub(props) {
	return GenIcon({
		"tag": "svg",
		"attr": { "viewBox": "0 0 496 512" },
		"child": [{
			"tag": "path",
			"attr": { "d": "M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z" },
			"child": []
		}]
	})(props);
}
function FaBook(props) {
	return GenIcon({
		"tag": "svg",
		"attr": { "viewBox": "0 0 448 512" },
		"child": [{
			"tag": "path",
			"attr": { "d": "M448 360V24c0-13.3-10.7-24-24-24H96C43 0 0 43 0 96v320c0 53 43 96 96 96h328c13.3 0 24-10.7 24-24v-16c0-7.5-3.5-14.3-8.9-18.7-4.2-15.4-4.2-59.3 0-74.7 5.4-4.3 8.9-11.1 8.9-18.6zM128 134c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm0 64c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm253.4 250H96c-17.7 0-32-14.3-32-32 0-17.6 14.4-32 32-32h285.4c-1.9 17.1-1.9 46.9 0 64z" },
			"child": []
		}]
	})(props);
}
function FaCalendar(props) {
	return GenIcon({
		"tag": "svg",
		"attr": { "viewBox": "0 0 448 512" },
		"child": [{
			"tag": "path",
			"attr": { "d": "M12 192h424c6.6 0 12 5.4 12 12v260c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V204c0-6.6 5.4-12 12-12zm436-44v-36c0-26.5-21.5-48-48-48h-48V12c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v52H160V12c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v52H48C21.5 64 0 85.5 0 112v36c0 6.6 5.4 12 12 12h424c6.6 0 12-5.4 12-12z" },
			"child": []
		}]
	})(props);
}
function FaDoorOpen(props) {
	return GenIcon({
		"tag": "svg",
		"attr": { "viewBox": "0 0 640 512" },
		"child": [{
			"tag": "path",
			"attr": { "d": "M624 448h-80V113.45C544 86.19 522.47 64 496 64H384v64h96v384h144c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16zM312.24 1.01l-192 49.74C105.99 54.44 96 67.7 96 82.92V448H16c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h336V33.18c0-21.58-19.56-37.41-39.76-32.17zM264 288c-13.25 0-24-14.33-24-32s10.75-32 24-32 24 14.33 24 32-10.75 32-24 32z" },
			"child": []
		}]
	})(props);
}
function FaExternalLinkAlt(props) {
	return GenIcon({
		"tag": "svg",
		"attr": { "viewBox": "0 0 512 512" },
		"child": [{
			"tag": "path",
			"attr": { "d": "M432,320H400a16,16,0,0,0-16,16V448H64V128H208a16,16,0,0,0,16-16V80a16,16,0,0,0-16-16H48A48,48,0,0,0,0,112V464a48,48,0,0,0,48,48H400a48,48,0,0,0,48-48V336A16,16,0,0,0,432,320ZM488,0h-128c-21.37,0-32.05,25.91-17,41l35.73,35.73L135,320.37a24,24,0,0,0,0,34L157.67,377a24,24,0,0,0,34,0L435.28,133.32,471,169c15,15,41,4.5,41-17V24A24,24,0,0,0,488,0Z" },
			"child": []
		}]
	})(props);
}
function FaGlobe(props) {
	return GenIcon({
		"tag": "svg",
		"attr": { "viewBox": "0 0 496 512" },
		"child": [{
			"tag": "path",
			"attr": { "d": "M336.5 160C322 70.7 287.8 8 248 8s-74 62.7-88.5 152h177zM152 256c0 22.2 1.2 43.5 3.3 64h185.3c2.1-20.5 3.3-41.8 3.3-64s-1.2-43.5-3.3-64H155.3c-2.1 20.5-3.3 41.8-3.3 64zm324.7-96c-28.6-67.9-86.5-120.4-158-141.6 24.4 33.8 41.2 84.7 50 141.6h108zM177.2 18.4C105.8 39.6 47.8 92.1 19.3 160h108c8.7-56.9 25.5-107.8 49.9-141.6zM487.4 192H372.7c2.1 21 3.3 42.5 3.3 64s-1.2 43-3.3 64h114.6c5.5-20.5 8.6-41.8 8.6-64s-3.1-43.5-8.5-64zM120 256c0-21.5 1.2-43 3.3-64H8.6C3.2 212.5 0 233.8 0 256s3.2 43.5 8.6 64h114.6c-2-21-3.2-42.5-3.2-64zm39.5 96c14.5 89.3 48.7 152 88.5 152s74-62.7 88.5-152h-177zm159.3 141.6c71.4-21.2 129.4-73.7 158-141.6h-108c-8.8 56.9-25.6 107.8-50 141.6zM19.3 352c28.6 67.9 86.5 120.4 158 141.6-24.4-33.8-41.2-84.7-50-141.6h-108z" },
			"child": []
		}]
	})(props);
}
function FaStar(props) {
	return GenIcon({
		"tag": "svg",
		"attr": { "viewBox": "0 0 576 512" },
		"child": [{
			"tag": "path",
			"attr": { "d": "M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z" },
			"child": []
		}]
	})(props);
}
function FaVolumeMute(props) {
	return GenIcon({
		"tag": "svg",
		"attr": { "viewBox": "0 0 512 512" },
		"child": [{
			"tag": "path",
			"attr": { "d": "M215.03 71.05L126.06 160H24c-13.26 0-24 10.74-24 24v144c0 13.25 10.74 24 24 24h102.06l88.97 88.95c15.03 15.03 40.97 4.47 40.97-16.97V88.02c0-21.46-25.96-31.98-40.97-16.97zM461.64 256l45.64-45.64c6.3-6.3 6.3-16.52 0-22.82l-22.82-22.82c-6.3-6.3-16.52-6.3-22.82 0L416 210.36l-45.64-45.64c-6.3-6.3-16.52-6.3-22.82 0l-22.82 22.82c-6.3 6.3-6.3 16.52 0 22.82L370.36 256l-45.63 45.63c-6.3 6.3-6.3 16.52 0 22.82l22.82 22.82c6.3 6.3 16.52 6.3 22.82 0L416 301.64l45.64 45.64c6.3 6.3 16.52 6.3 22.82 0l22.82-22.82c6.3-6.3 6.3-16.52 0-22.82L461.64 256z" },
			"child": []
		}]
	})(props);
}
function FaVolumeUp(props) {
	return GenIcon({
		"tag": "svg",
		"attr": { "viewBox": "0 0 576 512" },
		"child": [{
			"tag": "path",
			"attr": { "d": "M215.03 71.05L126.06 160H24c-13.26 0-24 10.74-24 24v144c0 13.25 10.74 24 24 24h102.06l88.97 88.95c15.03 15.03 40.97 4.47 40.97-16.97V88.02c0-21.46-25.96-31.98-40.97-16.97zm233.32-51.08c-11.17-7.33-26.18-4.24-33.51 6.95-7.34 11.17-4.22 26.18 6.95 33.51 66.27 43.49 105.82 116.6 105.82 195.58 0 78.98-39.55 152.09-105.82 195.58-11.17 7.32-14.29 22.34-6.95 33.5 7.04 10.71 21.93 14.56 33.51 6.95C528.27 439.58 576 351.33 576 256S528.27 72.43 448.35 19.97zM480 256c0-63.53-32.06-121.94-85.77-156.24-11.19-7.14-26.03-3.82-33.12 7.46s-3.78 26.21 7.41 33.36C408.27 165.97 432 209.11 432 256s-23.73 90.03-63.48 115.42c-11.19 7.14-14.5 22.07-7.41 33.36 6.51 10.36 21.12 15.14 33.12 7.46C447.94 377.94 480 319.54 480 256zm-141.77-76.87c-11.58-6.33-26.19-2.16-32.61 9.45-6.39 11.61-2.16 26.2 9.45 32.61C327.98 228.28 336 241.63 336 256c0 14.38-8.02 27.72-20.92 34.81-11.61 6.41-15.84 21-9.45 32.61 6.43 11.66 21.05 15.8 32.61 9.45 28.23-15.55 45.77-45 45.77-76.88s-17.54-61.32-45.78-76.86z" },
			"child": []
		}]
	})(props);
}
//#endregion
//#region renderer/Link.tsx
var import_jsx_runtime = require_jsx_runtime();
function Link(p) {
	const pageContext = usePageContext();
	const { children, href, ...props } = p;
	const className = [props.className, pageContext.urlPathname === href && "is-active"].filter(Boolean).join(" ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
		href,
		...props,
		className,
		children
	});
}
//#endregion
//#region ../../node_modules/.pnpm/vike-react@0.6.5_react-dom@19.1.1_react@19.1.1__react@19.1.1_vike@0.4.258_react-streami_8122522992f12b1b3e002641958b9f3e/node_modules/vike-react/dist/helpers/clientOnly.js
function clientOnly(load) {
	var _a;
	(_a = import.meta).env ?? (_a.env = { SSR: true });
	{
		const Component = (0, import_react.lazy)(() => load().then((LoadedComponent) => "default" in LoadedComponent ? LoadedComponent : { default: LoadedComponent }).catch((error) => {
			console.error("Component loading failed:", error);
			return { default: (() => import_react.createElement("p", null, "Error loading component.")) };
		}));
		return (0, import_react.forwardRef)((props, ref) => {
			const [mounted, setMounted] = (0, import_react.useState)(false);
			(0, import_react.useEffect)(() => {
				setMounted(true);
			}, []);
			if (!mounted) return import_react.createElement(import_react.Fragment, null, props.fallback);
			const { fallback, ...rest } = props;
			return import_react.createElement(import_react.Suspense, { fallback: import_react.createElement(import_react.Fragment, null, props.fallback) }, import_react.createElement(Component, {
				...rest,
				ref
			}));
		});
	}
}
//#endregion
//#region ../../node_modules/.pnpm/react-icons@5.5.0_react@19.1.1/node_modules/react-icons/io5/index.mjs
function IoClose(props) {
	return GenIcon({
		"tag": "svg",
		"attr": { "viewBox": "0 0 512 512" },
		"child": [{
			"tag": "path",
			"attr": { "d": "m289.94 256 95-95A24 24 0 0 0 351 127l-95 95-95-95a24 24 0 0 0-34 34l95 95-95 95a24 24 0 1 0 34 34l95-95 95 95a24 24 0 0 0 34-34z" },
			"child": []
		}]
	})(props);
}
//#endregion
//#region src/shared-components/toaster.tsx
function Toaster() {
	const [toasts, setToasts] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		const listener = (e) => {
			const id = performance.now() + Math.random().toFixed(4);
			setToasts((prev) => [{
				...e.detail,
				id
			}, ...prev]);
			if (e.detail.ephemeral !== false) setTimeout(() => {
				setToasts((prev) => prev.slice(0, -1));
			}, e.detail.duration ?? 3e3);
		};
		window.addEventListener("toast", listener);
		return () => {
			window.removeEventListener("toast", listener);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		style: {
			position: "fixed",
			bottom: 0,
			right: 0,
			display: "flex",
			flexDirection: "column",
			gap: 8,
			margin: 16,
			borderRadius: 8,
			width: "min(100%, 400px)"
		},
		children: toasts.map((toast, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				transition: "bottom 0.3s",
				bottom: `${i * 64}px`,
				right: 0,
				position: "absolute",
				textAlign: "right",
				padding: "1em",
				borderRadius: 8,
				...((style) => {
					switch (style) {
						case "success": return {
							backgroundColor: "#282",
							color: "white"
						};
						case "error": return {
							backgroundColor: "#822",
							color: "white"
						};
						case "info": return {
							backgroundColor: "#228",
							color: "white"
						};
						default: return {
							backgroundColor: "#434",
							color: "white"
						};
					}
				})(toast.style),
				opacity: .7,
				display: "flex",
				alignItems: "center"
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				style: {
					display: "inline-block",
					appearance: "none",
					border: "none",
					padding: 0,
					background: "none"
				},
				onClick: () => {
					setToasts((prev) => prev.filter((t) => t.id !== toast.id));
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IoClose, {
					color: "white",
					fontSize: "2em"
				})
			}), toast.content]
		}, toast.id))
	});
}
var spotlight_search_module_default = {
	trigger: "_trigger_1gee5_2",
	triggerLabel: "_triggerLabel_1gee5_23",
	triggerHint: "_triggerHint_1gee5_28",
	icon: "_icon_1gee5_37",
	overlay: "_overlay_1gee5_42",
	panel: "_panel_1gee5_53",
	inputRow: "_inputRow_1gee5_65",
	input: "_input_1gee5_65",
	close: "_close_1gee5_82",
	results: "_results_1gee5_96",
	message: "_message_1gee5_101",
	group: "_group_1gee5_112",
	groupHeading: "_groupHeading_1gee5_116",
	result: "_result_1gee5_96",
	selected: "_selected_1gee5_136",
	subResult: "_subResult_1gee5_141",
	resultTitle: "_resultTitle_1gee5_144",
	resultExcerpt: "_resultExcerpt_1gee5_163"
};
//#endregion
//#region src/shared-components/spotlight-context.ts
var SpotlightContext = (0, import_react.createContext)({ open: () => void 0 });
function useSpotlight() {
	return (0, import_react.useContext)(SpotlightContext);
}
//#endregion
//#region src/shared-components/spotlight-search.tsx
var BASE_URL = "/";
var pagefindPromise = null;
function loadPagefind() {
	if (!pagefindPromise) pagefindPromise = (async () => {
		const root = BASE_URL.replace(/\/$/, "");
		// @vite-ignore: this file is emitted by the search-index step after the
		const api = await __vitePreload(() => import(
			/* @vite-ignore */
			`${root}/pagefind/pagefind.js`
), []);
		await api.options({ baseUrl: BASE_URL });
		return api;
	})();
	return pagefindPromise;
}
var KIND_ORDER = [
	"Blog",
	"Presentations",
	"Projects",
	"Tools",
	"Pages"
];
/**
* Results are classified by URL rather than a Pagefind filter so that crawled
* pages and the synthetic presentation records are grouped by the same rule.
*/
function kindOf(url) {
	const path = url.startsWith(BASE_URL) ? url.slice(0) : url;
	if (path.startsWith("/blog")) return "Blog";
	if (path.startsWith("/presentations")) return "Presentations";
	if (path.startsWith("/projects")) return "Projects";
	if (path.startsWith("/tools")) return "Tools";
	return "Pages";
}
var MAX_PAGES = 12;
var MAX_SUB_RESULTS = 2;
function toEntries(document_) {
	const title = document_.meta?.title?.trim() || document_.url;
	const kind = kindOf(document_.url);
	const entries = [{
		key: document_.url,
		kind,
		title,
		url: document_.url,
		excerpt: document_.excerpt,
		isSub: false
	}];
	for (const sub of (document_.sub_results ?? []).slice(0, MAX_SUB_RESULTS)) {
		if (!sub.anchor?.id || sub.url === document_.url) continue;
		entries.push({
			key: sub.url,
			kind,
			title: sub.title,
			url: sub.url,
			excerpt: sub.excerpt,
			isSub: true
		});
	}
	return entries;
}
function SpotlightProvider({ children }) {
	const [isOpen, setIsOpen] = (0, import_react.useState)(false);
	const triggerRef = (0, import_react.useRef)(null);
	const open = (0, import_react.useCallback)(() => {
		triggerRef.current = document.activeElement;
		setIsOpen(true);
	}, []);
	const close = (0, import_react.useCallback)(() => {
		setIsOpen(false);
		triggerRef.current?.focus();
		triggerRef.current = null;
	}, []);
	(0, import_react.useEffect)(() => {
		const onKeyDown = (event) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				if (isOpen) close();
				else open();
			}
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [
		isOpen,
		open,
		close
	]);
	(0, import_react.useEffect)(() => {
		if (!isOpen) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previous;
		};
	}, [isOpen]);
	const value = (0, import_react.useMemo)(() => ({ open }), [open]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SpotlightContext.Provider, {
		value,
		children: [children, isOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpotlightDialog, { onClose: close })]
	});
}
function SpotlightTrigger({ className }) {
	const { open } = useSpotlight();
	const [shortcut, setShortcut] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setShortcut(/mac|iphone|ipad/i.test(navigator.userAgent) ? "⌘K" : "Ctrl K");
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: [spotlight_search_module_default.trigger, className].filter(Boolean).join(" "),
		onClick: open,
		"aria-label": "Search the site",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchIcon, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: spotlight_search_module_default.triggerLabel,
				children: "Search"
			}),
			shortcut && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
				className: spotlight_search_module_default.triggerHint,
				children: shortcut
			})
		]
	});
}
function SpotlightDialog({ onClose }) {
	const [query, setQuery] = (0, import_react.useState)("");
	const [entries, setEntries] = (0, import_react.useState)([]);
	const [status, setStatus] = (0, import_react.useState)("idle");
	const [selected, setSelected] = (0, import_react.useState)(0);
	const inputRef = (0, import_react.useRef)(null);
	const listRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		inputRef.current?.focus();
	}, []);
	(0, import_react.useEffect)(() => {
		const trimmed = query.trim();
		if (!trimmed) {
			setEntries([]);
			setStatus("idle");
			return;
		}
		setStatus("searching");
		let cancelled = false;
		const timer = setTimeout(async () => {
			try {
				const { results } = await (await loadPagefind()).search(trimmed);
				const documents = await Promise.all(results.slice(0, MAX_PAGES).map((result) => result.data()));
				if (cancelled) return;
				setEntries(documents.flatMap(toEntries));
				setSelected(0);
				setStatus("ready");
			} catch {
				if (cancelled) return;
				setStatus("unavailable");
			}
		}, 150);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [query]);
	const groups = (0, import_react.useMemo)(() => {
		const byKind = /* @__PURE__ */ new Map();
		for (const entry of entries) {
			const bucket = byKind.get(entry.kind);
			if (bucket) bucket.push(entry);
			else byKind.set(entry.kind, [entry]);
		}
		return KIND_ORDER.flatMap((kind) => {
			const kindEntries = byKind.get(kind);
			return kindEntries ? [{
				kind,
				entries: kindEntries
			}] : [];
		});
	}, [entries]);
	const ordered = (0, import_react.useMemo)(() => groups.flatMap((group) => group.entries), [groups]);
	const go = (0, import_react.useCallback)((entry) => {
		if (entry) window.location.href = entry.url;
	}, []);
	(0, import_react.useEffect)(() => {
		const onEscape = (event) => {
			if (event.key !== "Escape") return;
			event.preventDefault();
			onClose();
		};
		document.addEventListener("keydown", onEscape);
		return () => document.removeEventListener("keydown", onEscape);
	}, [onClose]);
	const onKeyDown = (event) => {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			setSelected((i) => ordered.length ? (i + 1) % ordered.length : 0);
			return;
		}
		if (event.key === "ArrowUp") {
			event.preventDefault();
			setSelected((i) => ordered.length ? (i - 1 + ordered.length) % ordered.length : 0);
			return;
		}
		if (event.key === "Enter") {
			event.preventDefault();
			go(ordered[selected]);
		}
	};
	(0, import_react.useEffect)(() => {
		listRef.current?.querySelector("[aria-selected=\"true\"]")?.scrollIntoView({ block: "nearest" });
	}, [selected]);
	let index = -1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: spotlight_search_module_default.overlay,
		onClick: onClose,
		role: "presentation",
		"data-pagefind-ignore": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: spotlight_search_module_default.panel,
			role: "dialog",
			"aria-modal": "true",
			"aria-label": "Search the site",
			onClick: (event) => event.stopPropagation(),
			onKeyDown,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: spotlight_search_module_default.inputRow,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchIcon, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: inputRef,
						className: spotlight_search_module_default.input,
						type: "text",
						value: query,
						placeholder: "Search posts, talks, and projects…",
						"aria-label": "Search query",
						onChange: (event) => setQuery(event.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: spotlight_search_module_default.close,
						onClick: onClose,
						"aria-label": "Close search",
						children: "Esc"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: spotlight_search_module_default.results,
				ref: listRef,
				role: "listbox",
				children: [
					status === "unavailable" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: spotlight_search_module_default.message,
						children: [
							"Search is unavailable — the index is generated at build time. Run",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "nx build craigory-dev" }),
							" and use the built site."
						]
					}),
					status === "ready" && !ordered.length && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: spotlight_search_module_default.message,
						children: [
							"No matches for “",
							query.trim(),
							"”."
						]
					}),
					status === "idle" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: spotlight_search_module_default.message,
						children: "Search across blog posts, talk slides, and projects."
					}),
					groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: spotlight_search_module_default.group,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: spotlight_search_module_default.groupHeading,
							children: group.kind
						}), group.entries.map((entry) => {
							index += 1;
							const position = index;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: entry.url,
								role: "option",
								"aria-selected": position === selected,
								className: [
									spotlight_search_module_default.result,
									entry.isSub ? spotlight_search_module_default.subResult : "",
									position === selected ? spotlight_search_module_default.selected : ""
								].filter(Boolean).join(" "),
								onMouseEnter: () => setSelected(position),
								onClick: (event) => {
									event.preventDefault();
									go(entry);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: spotlight_search_module_default.resultTitle,
									children: entry.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: spotlight_search_module_default.resultExcerpt,
									dangerouslySetInnerHTML: { __html: entry.excerpt }
								})]
							}, entry.key);
						})]
					}, group.kind))
				]
			})]
		})
	});
}
function SearchIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		className: spotlight_search_module_default.icon,
		width: "18",
		height: "18",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "11",
			cy: "11",
			r: "7"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
			x1: "16.5",
			y1: "16.5",
			x2: "21",
			y2: "21"
		})]
	});
}
//#endregion
//#region renderer/MobileNav.tsx
function MobileNav({ children }) {
	const [isOpen, setIsOpen] = (0, import_react.useState)(false);
	const [scrolledDown, setScrolledDown] = (0, import_react.useState)(false);
	const headerRef = (0, import_react.useRef)(null);
	const drawerRef = (0, import_react.useRef)(null);
	const triggerRef = (0, import_react.useRef)(null);
	const pageContext = usePageContext();
	const closeDrawer = () => setIsOpen(false);
	(0, import_react.useEffect)(() => {
		closeDrawer();
	}, [pageContext.urlPathname]);
	(0, import_react.useEffect)(() => {
		const handleEsc = (e) => {
			if (e.key === "Escape" && isOpen) closeDrawer();
		};
		document.addEventListener("keydown", handleEsc);
		return () => document.removeEventListener("keydown", handleEsc);
	}, [isOpen]);
	(0, import_react.useEffect)(() => {
		if (isOpen) document.body.style.overflow = "hidden";
		else document.body.style.overflow = "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);
	(0, import_react.useEffect)(() => {
		if (isOpen) document.querySelector(".menu-toggle")?.focus();
		else if (!isOpen && triggerRef.current) {
			triggerRef.current.focus();
			triggerRef.current = null;
		}
	}, [isOpen]);
	(0, import_react.useEffect)(() => {
		const handleScroll = () => {
			setScrolledDown(window.scrollY > 60);
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);
	const toggleDrawer = () => {
		if (!isOpen) triggerRef.current = document.activeElement;
		setIsOpen(!isOpen);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mobile-nav-container",
		"data-pagefind-ignore": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileHeader, { ref: headerRef }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mobile-content",
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileDrawer, {
				ref: drawerRef,
				isOpen
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileOverlay, {
				isOpen,
				onClick: closeDrawer
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuToggle, {
				isOpen,
				onClick: toggleDrawer,
				scrolledDown
			})
		]
	});
}
var MobileHeader = import_react.forwardRef((_, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
	ref,
	className: "mobile-header",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mobile-header-brand" })
}));
MobileHeader.displayName = "MobileHeader";
function MenuToggle({ isOpen, onClick, scrolledDown }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: [
			"menu-toggle",
			isOpen && "menu-toggle--open",
			scrolledDown && !isOpen && "menu-toggle--scrolled"
		].filter(Boolean).join(" "),
		onClick,
		"aria-label": isOpen ? "Close navigation menu" : "Open navigation menu",
		"aria-expanded": isOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HamburgerIcon, {})
	});
}
var MobileDrawer = import_react.forwardRef(({ isOpen }, ref) => {
	const handleKeyDown = (e) => {
		if (e.key !== "Tab" || !ref || typeof ref === "function") return;
		const focusableElements = ref.current?.querySelectorAll("button, a[href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])");
		if (!focusableElements || focusableElements.length === 0) return;
		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];
		if (e.shiftKey && document.activeElement === firstElement) {
			e.preventDefault();
			lastElement.focus();
		} else if (!e.shiftKey && document.activeElement === lastElement) {
			e.preventDefault();
			firstElement.focus();
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
		ref,
		className: `mobile-drawer ${isOpen ? "mobile-drawer--open" : ""}`,
		role: "dialog",
		"aria-label": "Navigation menu",
		"aria-hidden": !isOpen,
		onKeyDown: handleKeyDown,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mobile-drawer-nav",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpotlightTrigger, { className: "mobile-search-trigger" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					className: "mobile-navitem",
					href: "/",
					children: "Home"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					className: "mobile-navitem",
					href: "/projects",
					children: "Projects"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					className: "mobile-navitem",
					href: "/tools",
					children: "Tools"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					className: "mobile-navitem",
					href: "/presentations",
					children: "Speaking + Presentations"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					className: "mobile-navitem",
					href: `/blog/1`,
					children: "Blog"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mobile-drawer-footer",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				className: "mobile-footer-link",
				href: "/privacy",
				children: "Privacy Policy"
			})
		})]
	});
});
MobileDrawer.displayName = "MobileDrawer";
function MobileOverlay({ isOpen, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `mobile-overlay ${isOpen ? "mobile-overlay--visible" : ""}`,
		onClick,
		"aria-hidden": "true"
	});
}
function HamburgerIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		className: "hamburger-icon",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				className: "hamburger-line hamburger-line-top",
				x1: "3",
				y1: "6",
				x2: "21",
				y2: "6"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				className: "hamburger-line hamburger-line-middle",
				x1: "3",
				y1: "12",
				x2: "21",
				y2: "12"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				className: "hamburger-line hamburger-line-bottom",
				x1: "3",
				y1: "18",
				x2: "21",
				y2: "18"
			})
		]
	});
}
//#endregion
//#region src/bar3d/theme.ts
var KEY = "site-theme";
var DEFAULT_THEME = "bar";
var current = DEFAULT_THEME;
var hydrated = false;
var listeners = /* @__PURE__ */ new Set();
function emit() {
	listeners.forEach((l) => l());
}
function readStored() {
	const v = window.localStorage.getItem(KEY);
	return v === "3d" || v === "bar" || v === "minimal" ? v : DEFAULT_THEME;
}
function setSiteTheme(t) {
	current = t;
	window.localStorage.setItem(KEY, t);
	emit();
}
var subscribe = (cb) => {
	listeners.add(cb);
	return () => listeners.delete(cb);
};
function useSiteTheme() {
	const theme = (0, import_react.useSyncExternalStore)(subscribe, () => current, () => DEFAULT_THEME);
	(0, import_react.useEffect)(() => {
		if (!hydrated) {
			hydrated = true;
			const stored = readStored();
			if (stored !== current) {
				current = stored;
				emit();
			}
		}
	}, []);
	return [theme, setSiteTheme];
}
/** Map a pathname to the bar zone the camera should occupy. */
function zoneForPath(pathname) {
	if (pathname.startsWith("/projects")) return "projects";
	if (pathname.startsWith("/blog")) return "blog";
	if (pathname.startsWith("/presentations")) return "speaking";
	if (pathname.startsWith("/tools")) return "projects";
	return "home";
}
//#endregion
//#region src/bar3d/Facade.tsx
function Facade() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 2000 1100",
		preserveAspectRatio: "xMidYMax slice",
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: "fWall",
					x1: "0",
					y1: "0",
					x2: "0",
					y2: "1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "0",
							stopColor: "#0d0a08"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "0.75",
							stopColor: "#191310"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "1",
							stopColor: "#221a14"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: "fDoor",
					x1: "0",
					y1: "0",
					x2: "1",
					y2: "0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "0",
							stopColor: "#241409"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "0.5",
							stopColor: "#3a2210"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "1",
							stopColor: "#1c0f08"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: "fWin",
					x1: "0",
					y1: "0",
					x2: "0",
					y2: "1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "0",
							stopColor: "#f2c078"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "0.55",
							stopColor: "#e0a050"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "1",
							stopColor: "#a85c28"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("radialGradient", {
					id: "fPool",
					cx: "0.5",
					cy: "0.4",
					r: "0.6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "0",
						stopColor: "#e0a050",
						stopOpacity: "0.5"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "1",
						stopColor: "#e0a050",
						stopOpacity: "0"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("radialGradient", {
					id: "fSconce",
					cx: "0.5",
					cy: "0.5",
					r: "0.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "0",
							stopColor: "#f2c078",
							stopOpacity: "0.85"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "0.4",
							stopColor: "#e0a050",
							stopOpacity: "0.3"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "1",
							stopColor: "#e0a050",
							stopOpacity: "0"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("pattern", {
					id: "fFret",
					width: "40",
					height: "26",
					patternUnits: "userSpaceOnUse",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						width: "40",
						height: "26",
						fill: "#14100b"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M0 20 L10 6 L20 20 L30 6 L40 20",
						fill: "none",
						stroke: "#c9a227",
						strokeWidth: "3"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("pattern", {
					id: "fGrille",
					width: "26",
					height: "64",
					patternUnits: "userSpaceOnUse",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							width: "26",
							height: "64",
							fill: "none"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "10",
							width: "6",
							height: "64",
							fill: "#170d07"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: "M0 50 L13 38 L26 50",
							fill: "none",
							stroke: "#170d07",
							strokeWidth: "6"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("clipPath", {
					id: "fPeepClip",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "466",
						y: "696",
						width: "68",
						height: "26",
						rx: "4"
					})
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "2000",
				height: "1100",
				fill: "url(#fWall)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
				stroke: "#0a0706",
				strokeWidth: "3",
				opacity: "0.8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M160 0 V1100 M330 0 V1100 M500 0 V1100 M1500 0 V1100 M1670 0 V1100 M1840 0 V1100" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
				transform: "translate(500 0)",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
						cx: "500",
						cy: "170",
						rx: "340",
						ry: "230",
						fill: "url(#fSconce)",
						className: "f-breathe"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "482",
						y: "108",
						width: "36",
						height: "18",
						rx: "4",
						fill: "#100c09"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "500",
						cy: "144",
						r: "17",
						fill: "#f6d9a0"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "286",
							y: "252",
							width: "428",
							height: "800",
							fill: "#241708"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "302",
							y: "278",
							width: "396",
							height: "774",
							fill: "#170f08"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "340",
							y: "224",
							width: "320",
							height: "30",
							fill: "#1c1208"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
							stroke: "#c9a227",
							strokeWidth: "2",
							opacity: "0.7",
							fill: "none",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M302 278 h396 M340 224 h320" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "302",
							y: "284",
							width: "396",
							height: "24",
							fill: "url(#fFret)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
							transform: "translate(500 240)",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
									rx: "19",
									ry: "24",
									fill: "#4a3016"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: "M0 -24 A19 24 0 0 1 16 11 L13 8 A16 20 0 0 0 0 -20 Z",
									fill: "#5c3d1e"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: "M-14 -8 Q0 -14 14 -8 L12 -4 Q0 -9 -12 -4 Z",
									fill: "#241505"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
									cx: "-6",
									cy: "1",
									rx: "3.2",
									ry: "2.6",
									fill: "#170d07"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
									cx: "6",
									cy: "1",
									rx: "3.2",
									ry: "2.6",
									fill: "#170d07"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: "M-2 2 L2 2 L3 9 L-3 9 Z",
									fill: "#241505"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: "M-9 13 Q0 16 9 13 L8 17 Q0 20 -8 17 Z",
									fill: "#241505"
								})
							]
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "330",
							y: "312",
							width: "340",
							height: "740",
							fill: "url(#fDoor)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
							stroke: "#150c06",
							strokeWidth: "3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M386 312 V1052 M442 312 V1052 M500 312 V1052 M558 312 V1052 M614 312 V1052" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
							stroke: "#5a3a1c",
							strokeWidth: "1.2",
							opacity: "0.7",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M389 312 V1052 M445 312 V1052 M503 312 V1052 M561 312 V1052 M617 312 V1052" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
							className: "f-breathe-b",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
									x: "376",
									y: "362",
									width: "72",
									height: "290",
									rx: "36",
									fill: "url(#fWin)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
									x: "552",
									y: "362",
									width: "72",
									height: "290",
									rx: "36",
									fill: "url(#fWin)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
									x: "376",
									y: "362",
									width: "72",
									height: "290",
									rx: "36",
									fill: "url(#fGrille)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
									x: "552",
									y: "362",
									width: "72",
									height: "290",
									rx: "36",
									fill: "url(#fGrille)"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
							stroke: "#c9a227",
							strokeWidth: "3.5",
							fill: "none",
							opacity: "0.95",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
								x: "376",
								y: "362",
								width: "72",
								height: "290",
								rx: "36"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
								x: "552",
								y: "362",
								width: "72",
								height: "290",
								rx: "36"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
							fill: "#141210",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M330 330 h84 l20 9 l-20 9 h-84 Z" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M330 690 h118 l26 11 l-26 11 h-118 Z" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M330 950 h118 l26 11 l-26 11 h-118 Z" })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
							fill: "#3a3630",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "352",
									cy: "339",
									r: "3.5"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "386",
									cy: "339",
									r: "3.5"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "356",
									cy: "701",
									r: "4"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "398",
									cy: "701",
									r: "4"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "438",
									cy: "701",
									r: "4"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "356",
									cy: "961",
									r: "4"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "398",
									cy: "961",
									r: "4"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "438",
									cy: "961",
									r: "4"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
							className: "f-peep",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
								x: "462",
								y: "692",
								width: "76",
								height: "34",
								rx: "5",
								fill: "#100c09"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
								clipPath: "url(#fPeepClip)",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
									className: "f-peep-reveal",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
											x: "466",
											y: "696",
											width: "68",
											height: "26",
											fill: "url(#fWin)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
											cx: "486",
											cy: "709",
											rx: "4.5",
											ry: "3.6",
											fill: "#241505"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
											cx: "507",
											cy: "709",
											rx: "4.5",
											ry: "3.6",
											fill: "#241505"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
											className: "f-peep-pupils",
											fill: "#170d07",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
												cx: "487",
												cy: "709.5",
												r: "1.9"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
												cx: "508",
												cy: "709.5",
												r: "1.9"
											})]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
									className: "f-peep-slat",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
											x: "466",
											y: "696",
											width: "68",
											height: "26",
											rx: "4",
											fill: "#2c2013"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
											x: "472",
											y: "702",
											width: "40",
											height: "14",
											rx: "3",
											fill: "#c9a227",
											opacity: "0.85"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
											cx: "524",
											cy: "709",
											r: "6",
											fill: "#c9a227"
										})
									]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
							transform: "translate(500 806)",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
									rx: "29",
									ry: "37",
									fill: "#4a3016"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: "M0 -37 A29 37 0 0 1 25 18 L20 14 A24 31 0 0 0 0 -31 Z",
									fill: "#5c3d1e"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
									rx: "29",
									ry: "37",
									fill: "none",
									stroke: "#1c1208",
									strokeWidth: "2.5"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: "M-22 -14 Q0 -24 22 -14 L19 -7 Q0 -15 -19 -7 Z",
									fill: "#241505"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: "M-22 -14 Q0 -24 22 -14",
									fill: "none",
									stroke: "#6b4a26",
									strokeWidth: "2"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
									cx: "-10",
									cy: "-3",
									rx: "5",
									ry: "4",
									fill: "#170d07"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
									cx: "10",
									cy: "-3",
									rx: "5",
									ry: "4",
									fill: "#170d07"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: "M-3 -2 L3 -2 L5 12 L0 15 L-5 12 Z",
									fill: "#241505"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "-2.5",
									cy: "12",
									r: "1.2",
									fill: "#170d07"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "2.5",
									cy: "12",
									r: "1.2",
									fill: "#170d07"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: "M-13 21 Q0 26 13 21 L11 28 Q0 32 -11 28 Z",
									fill: "#241505"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: "M-7 22 V28 M0 24 V30 M7 22 V28",
									stroke: "#6b4a26",
									strokeWidth: "2"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
									x: "-4",
									y: "34",
									width: "8",
									height: "6",
									rx: "2",
									fill: "#c9a227"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: "M-16 46 A16 16 0 0 0 16 46",
									fill: "none",
									stroke: "#c9a227",
									strokeWidth: "5"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "636",
							y: "640",
							width: "12",
							height: "120",
							rx: "6",
							fill: "#c9a227"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "338",
							y: "1002",
							width: "324",
							height: "30",
							fill: "#c9a227",
							opacity: "0.7"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
							transform: "translate(555 650)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
								className: "f-knock-burst f-knock-burst-a",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: "M0 -48 L7 -16 L33 -33 L16 -7 L50 0 L16 7 L30 30 L7 16 L0 44 L-7 16 L-36 36 L-16 7 L-46 0 L-16 -7 L-30 -30 L-7 -16 Z",
									fill: "#f6efe2",
									stroke: "#1a120b",
									strokeWidth: "3",
									strokeLinejoin: "round"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
									className: "fk-lines",
									stroke: "#f6efe2",
									strokeWidth: "5",
									strokeLinecap: "round",
									fill: "none",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M62 -30 L92 -44" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M68 -4 L104 -6" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M60 22 L90 36" })
									]
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
							transform: "translate(524 710) scale(0.8)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
								className: "f-knock-burst f-knock-burst-b",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: "M0 -48 L7 -16 L33 -33 L16 -7 L50 0 L16 7 L30 30 L7 16 L0 44 L-7 16 L-36 36 L-16 7 L-46 0 L-16 -7 L-30 -30 L-7 -16 Z",
									fill: "#f6efe2",
									stroke: "#1a120b",
									strokeWidth: "3",
									strokeLinejoin: "round"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
									className: "fk-lines",
									stroke: "#f6efe2",
									strokeWidth: "5",
									strokeLinecap: "round",
									fill: "none",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M-62 -26 L-94 -38" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M-66 0 L-102 2" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M-58 24 L-88 38" })
									]
								})]
							})
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
						transform: "translate(742 560)",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "-6",
							y: "-24",
							width: "76",
							height: "44",
							rx: "4",
							fill: "#1c1c22",
							stroke: "#4a4a54",
							strokeWidth: "2"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
							x: "32",
							y: "6",
							textAnchor: "middle",
							fontFamily: "Georgia, serif",
							fontSize: "24",
							fill: "#8a8a94",
							children: "C · C"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "344",
						y: "1048",
						width: "312",
						height: "7",
						rx: "3.5",
						fill: "#f2c078",
						className: "f-breathe-b"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
						cx: "500",
						cy: "1078",
						rx: "310",
						ry: "50",
						fill: "url(#fPool)"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				y: "1044",
				width: "2000",
				height: "56",
				fill: "#0a0806",
				opacity: "0.85"
			})
		]
	});
}
//#endregion
//#region src/bar3d/knock.ts
/**
* The knock on the speakeasy door, synthesized — no audio asset to ship.
* Each rap is a low sine thump (the door body) plus a short burst of
* bandpassed noise (the knuckle). Called from a click handler, so the
* AudioContext is allowed to start by autoplay policy.
*/
var audio = null;
function playKnock() {
	audio ??= new AudioContext();
	if (audio.state === "suspended") audio.resume();
	const rap = (offset) => {
		const t = audio.currentTime + offset;
		const thump = audio.createOscillator();
		thump.type = "sine";
		thump.frequency.setValueAtTime(160, t);
		thump.frequency.exponentialRampToValueAtTime(55, t + .08);
		const thumpGain = audio.createGain();
		thumpGain.gain.setValueAtTime(.4, t);
		thumpGain.gain.exponentialRampToValueAtTime(.001, t + .14);
		thump.connect(thumpGain).connect(audio.destination);
		thump.start(t);
		thump.stop(t + .15);
		const buf = audio.createBuffer(1, Math.ceil(audio.sampleRate * .03), audio.sampleRate);
		const data = buf.getChannelData(0);
		for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
		const click = audio.createBufferSource();
		click.buffer = buf;
		const band = audio.createBiquadFilter();
		band.type = "bandpass";
		band.frequency.value = 1800;
		band.Q.value = .8;
		const clickGain = audio.createGain();
		clickGain.gain.setValueAtTime(.18, t);
		click.connect(band).connect(clickGain).connect(audio.destination);
		click.start(t);
	};
	rap(0);
	rap(.16);
}
/**
* The peephole slat sliding open: wood-on-wood scrape — noise through a
* bandpass sweeping upward with a wobble, ending in a soft stop-clack.
* Distinct from the knock so the slide doesn't read as more rapping.
*/
function playSlide() {
	audio ??= new AudioContext();
	if (audio.state === "suspended") audio.resume();
	const t = audio.currentTime;
	const scrapeLen = .32;
	const buf = audio.createBuffer(1, Math.ceil(audio.sampleRate * scrapeLen), audio.sampleRate);
	const data = buf.getChannelData(0);
	for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
	const scrape = audio.createBufferSource();
	scrape.buffer = buf;
	const band = audio.createBiquadFilter();
	band.type = "bandpass";
	band.Q.value = 3;
	band.frequency.setValueAtTime(420, t);
	band.frequency.linearRampToValueAtTime(760, t + scrapeLen * .6);
	band.frequency.linearRampToValueAtTime(640, t + scrapeLen);
	const scrapeGain = audio.createGain();
	scrapeGain.gain.setValueAtTime(1e-4, t);
	scrapeGain.gain.exponentialRampToValueAtTime(.13, t + .06);
	scrapeGain.gain.setValueAtTime(.13, t + scrapeLen - .08);
	scrapeGain.gain.exponentialRampToValueAtTime(.001, t + scrapeLen);
	scrape.connect(band).connect(scrapeGain).connect(audio.destination);
	scrape.start(t);
	const clack = audio.createOscillator();
	clack.type = "triangle";
	clack.frequency.setValueAtTime(260, t + scrapeLen);
	clack.frequency.exponentialRampToValueAtTime(120, t + scrapeLen + .05);
	const clackGain = audio.createGain();
	clackGain.gain.setValueAtTime(.12, t + scrapeLen);
	clackGain.gain.exponentialRampToValueAtTime(.001, t + scrapeLen + .07);
	clack.connect(clackGain).connect(audio.destination);
	clack.start(t + scrapeLen);
	clack.stop(t + scrapeLen + .08);
}
//#endregion
//#region src/bar3d/ambience.ts
var LOOP_SECS = 24;
var XFADE_SECS = 2;
var TARGET_VOL = .3;
var element = null;
var readyPromise = null;
var fadeRaf = 0;
var wantPlaying = false;
/** Random-walk automation curve: n points wandering inside [min, max]. */
function wander(n, min, max) {
	const out = new Float32Array(n);
	let v = (min + max) / 2;
	for (let i = 0; i < n; i++) {
		v += (Math.random() - .5) * (max - min) * .4;
		v = Math.min(max, Math.max(min, v));
		out[i] = v;
	}
	return out;
}
function renderLoop() {
	const sr = 44100;
	const total = LOOP_SECS + XFADE_SECS;
	const ctx = new OfflineAudioContext(2, Math.ceil(sr * total), sr);
	const noiseBuf = ctx.createBuffer(1, sr * 4, sr);
	{
		const d = noiseBuf.getChannelData(0);
		for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
	}
	const noiseSrc = () => {
		const s = ctx.createBufferSource();
		s.buffer = noiseBuf;
		s.loop = true;
		return s;
	};
	const panned = (pan) => {
		const p = ctx.createStereoPanner();
		p.pan.value = pan;
		p.connect(ctx.destination);
		return p;
	};
	{
		const src = noiseSrc();
		const lp = ctx.createBiquadFilter();
		lp.type = "lowpass";
		lp.frequency.value = 220;
		const g = ctx.createGain();
		g.gain.value = .045;
		const lfo = ctx.createOscillator();
		lfo.frequency.value = .11;
		const lfoG = ctx.createGain();
		lfoG.gain.value = .012;
		lfo.connect(lfoG).connect(g.gain);
		src.connect(lp).connect(g).connect(panned(0));
		src.start(0);
		lfo.start(0);
	}
	{
		const hum = ctx.createOscillator();
		hum.type = "sine";
		hum.frequency.value = 110;
		const g = ctx.createGain();
		g.gain.value = .006;
		hum.connect(g).connect(panned(0));
		hum.start(0);
	}
	[
		[380, -.4],
		[520, .1],
		[660, .5]
	].forEach(([freq, pan]) => {
		const src = noiseSrc();
		const bp = ctx.createBiquadFilter();
		bp.type = "bandpass";
		bp.frequency.value = freq;
		bp.Q.value = 2.2;
		const g = ctx.createGain();
		g.gain.setValueCurveAtTime(wander(28, .006, .032), 0, total);
		bp.frequency.setValueCurveAtTime(wander(20, freq * .8, freq * 1.25), 0, total);
		src.connect(bp).connect(g).connect(panned(pan));
		src.start(0);
	});
	for (const at of [2, 13.5]) {
		const src = noiseSrc();
		const lp = ctx.createBiquadFilter();
		lp.type = "lowpass";
		lp.frequency.setValueAtTime(150, at);
		lp.frequency.linearRampToValueAtTime(750, at + 4);
		lp.frequency.linearRampToValueAtTime(150, at + 8.5);
		const g = ctx.createGain();
		g.gain.setValueAtTime(1e-4, at);
		g.gain.linearRampToValueAtTime(.05, at + 4.2);
		g.gain.linearRampToValueAtTime(1e-4, at + 8.5);
		src.connect(lp).connect(g).connect(panned(-.6));
		src.start(at);
		src.stop(at + 8.6);
	}
	for (let i = 0; i < 6; i++) {
		const at = XFADE_SECS + .5 + Math.random() * (LOOP_SECS - XFADE_SECS - 1.5);
		const f = 1900 + Math.random() * 1300;
		const osc = ctx.createOscillator();
		osc.type = "triangle";
		osc.frequency.value = f;
		const g = ctx.createGain();
		const vol = .012 + Math.random() * .018;
		g.gain.setValueAtTime(vol, at);
		g.gain.exponentialRampToValueAtTime(1e-4, at + .18);
		osc.connect(g).connect(panned(Math.random() * 1.4 - .7));
		osc.start(at);
		osc.stop(at + .2);
	}
	for (const at of [6 + Math.random() * 4, 16 + Math.random() * 4]) {
		const osc = ctx.createOscillator();
		osc.type = "sine";
		osc.frequency.setValueAtTime(95, at);
		osc.frequency.exponentialRampToValueAtTime(55, at + .09);
		const g = ctx.createGain();
		g.gain.setValueAtTime(.02, at);
		g.gain.exponentialRampToValueAtTime(1e-4, at + .12);
		osc.connect(g).connect(panned(.3));
		osc.start(at);
		osc.stop(at + .13);
	}
	return ctx.startRendering();
}
/** Equal-power crossfade of the rendered tail over the head → seamless loop. */
function crossfadeLoop(buf) {
	const sr = buf.sampleRate;
	const loopLen = Math.floor(sr * LOOP_SECS);
	const fadeLen = Math.floor(sr * XFADE_SECS);
	const out = new AudioBuffer({
		length: loopLen,
		numberOfChannels: buf.numberOfChannels,
		sampleRate: sr
	});
	for (let ch = 0; ch < buf.numberOfChannels; ch++) {
		const src = buf.getChannelData(ch);
		const dst = out.getChannelData(ch);
		dst.set(src.subarray(0, loopLen));
		for (let i = 0; i < fadeLen; i++) {
			const t = i / fadeLen;
			dst[i] = dst[i] * Math.sin(t * Math.PI / 2) + src[loopLen + i] * Math.cos(t * Math.PI / 2);
		}
	}
	return out;
}
function encodeWav(buf) {
	const ch = buf.numberOfChannels;
	const len = buf.length * ch * 2;
	const ab = new ArrayBuffer(44 + len);
	const dv = new DataView(ab);
	const str = (o, s) => {
		for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i));
	};
	str(0, "RIFF");
	dv.setUint32(4, 36 + len, true);
	str(8, "WAVE");
	str(12, "fmt ");
	dv.setUint32(16, 16, true);
	dv.setUint16(20, 1, true);
	dv.setUint16(22, ch, true);
	dv.setUint32(24, buf.sampleRate, true);
	dv.setUint32(28, buf.sampleRate * ch * 2, true);
	dv.setUint16(32, ch * 2, true);
	dv.setUint16(34, 16, true);
	str(36, "data");
	dv.setUint32(40, len, true);
	let o = 44;
	for (let i = 0; i < buf.length; i++) for (let c = 0; c < ch; c++) {
		const v = Math.max(-1, Math.min(1, buf.getChannelData(c)[i]));
		dv.setInt16(o, v < 0 ? v * 32768 : v * 32767, true);
		o += 2;
	}
	return new Blob([ab], { type: "audio/wav" });
}
/** Kick off (or reuse) background generation; resolves with the element. */
function prepareAmbience() {
	if (!readyPromise) readyPromise = renderLoop().then((rendered) => {
		const wav = encodeWav(crossfadeLoop(rendered));
		element = new Audio(URL.createObjectURL(wav));
		element.loop = true;
		element.volume = 0;
		document.addEventListener("visibilitychange", () => {
			if (!element) return;
			if (document.hidden) element.pause();
			else if (wantPlaying) element.play().catch(() => {});
		});
		return element;
	});
	return readyPromise;
}
function fadeTo(vol, secs, then) {
	if (!element) return;
	cancelAnimationFrame(fadeRaf);
	const from = element.volume;
	const t0 = performance.now();
	const step = () => {
		if (!element) return;
		const t = Math.min(1, (performance.now() - t0) / (secs * 1e3));
		element.volume = from + (vol - from) * t;
		if (t < 1) fadeRaf = requestAnimationFrame(step);
		else then?.();
	};
	fadeRaf = requestAnimationFrame(step);
}
/** Play from a user gesture (always allowed). */
async function startAmbience() {
	const el = await prepareAmbience();
	wantPlaying = true;
	try {
		await el.play();
		fadeTo(TARGET_VOL, 2.5);
	} catch {
		wantPlaying = false;
	}
}
/**
* Gesture-less play attempt for the auto-entry path. Resolves true when the
* browser already trusts the origin (Chrome: MEI threshold crossed; Safari:
* per-site auto-play allowance) — the caller can then un-mute the knock too.
*/
async function tryAutoplayAmbience() {
	const el = await prepareAmbience();
	try {
		await el.play();
		wantPlaying = true;
		fadeTo(TARGET_VOL, 2.5);
		return true;
	} catch {
		return false;
	}
}
function stopAmbience(fadeSecs = .6) {
	wantPlaying = false;
	if (!element || element.paused) return;
	fadeTo(0, fadeSecs, () => element?.pause());
}
//#endregion
//#region renderer/PageShell.tsx
var BarCanvas = clientOnly(() => __vitePreload(() => import("./chunk-DaOsTb29.js").then((m) => m.BarCanvas), __vite__mapDeps([0,1,2,3,4,5,6,7])));
/** Small theme picker shared by every shell. */
function ThemeLinks() {
	const [theme, setTheme] = useSiteTheme();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "theme-links",
		"data-pagefind-ignore": true,
		children: [
			"3d",
			"bar",
			"minimal"
		].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: theme === t ? "is-current" : "",
			onClick: () => setTheme(t),
			children: t === "3d" ? "The bar (3D)" : t === "bar" ? "Classic" : "Minimal"
		}, t))
	});
}
function PageShell({ children }) {
	const [theme, setTheme] = useSiteTheme();
	const pageContext = usePageContext();
	const [doorState, setDoorState] = import_react.useState("outside");
	const [autoSequence, setAutoSequence] = import_react.useState(false);
	const doorTimer = import_react.useRef(null);
	const knockStart = import_react.useRef(0);
	const knockAudible = import_react.useRef(false);
	const [barReady, setBarReady] = import_react.useState(false);
	const [audioOn, setAudioOn] = import_react.useState(true);
	const audioOnRef = import_react.useRef(true);
	const probedRef = import_react.useRef(false);
	import_react.useEffect(() => {
		if (window.localStorage.getItem("bar-audio") === "off") {
			setAudioOn(false);
			audioOnRef.current = false;
		}
	}, []);
	import_react.useEffect(() => {
		if (theme !== "3d" || probedRef.current) return;
		probedRef.current = true;
		prepareAmbience();
		if (audioOnRef.current && window.sessionStorage.getItem("bar-entered") === "1") tryAutoplayAmbience().then((allowed) => {
			if (allowed) knockAudible.current = true;
		});
	}, [theme]);
	import_react.useEffect(() => {
		let autoKnock = null;
		if (window.sessionStorage.getItem("bar-entered") === "1") {
			setAutoSequence(true);
			autoKnock = setTimeout(() => {
				knockStart.current = performance.now();
				setDoorState("knocking");
			}, 1e3);
		}
		return () => {
			if (autoKnock) clearTimeout(autoKnock);
			if (doorTimer.current) clearTimeout(doorTimer.current);
		};
	}, []);
	import_react.useEffect(() => {
		if (window.__barReady) {
			setBarReady(true);
			return;
		}
		const onReady = () => setBarReady(true);
		window.addEventListener("bar-ready", onReady);
		return () => window.removeEventListener("bar-ready", onReady);
	}, []);
	const entered = doorState === "entering" || doorState === "inside";
	const enter = () => {
		window.sessionStorage.setItem("bar-entered", "1");
		knockStart.current = performance.now();
		knockAudible.current = audioOnRef.current;
		if (audioOnRef.current) startAmbience();
		setAutoSequence(false);
		setDoorState("knocking");
	};
	const toggleAudio = () => {
		const next = !audioOn;
		setAudioOn(next);
		audioOnRef.current = next;
		window.localStorage.setItem("bar-audio", next ? "on" : "off");
		if (!next) stopAmbience(.3);
		else if (entered) startAmbience();
	};
	import_react.useEffect(() => {
		if (doorState !== "knocking" || !knockAudible.current) return;
		playKnock();
		const slide = setTimeout(playSlide, 450);
		return () => {
			clearTimeout(slide);
			knockAudible.current = false;
		};
	}, [doorState]);
	import_react.useEffect(() => {
		if (doorState !== "knocking") return;
		const KNOCK_MS = 1400;
		const MAX_WAIT_MS = 9e3;
		const elapsed = performance.now() - knockStart.current;
		const wait = barReady ? Math.max(0, KNOCK_MS - elapsed) : Math.max(0, MAX_WAIT_MS - elapsed);
		const t = setTimeout(() => {
			setDoorState("entering");
			doorTimer.current = setTimeout(() => setDoorState("inside"), 1400);
		}, wait);
		return () => clearTimeout(t);
	}, [doorState, barReady]);
	const leave = () => {
		window.sessionStorage.removeItem("bar-entered");
		stopAmbience(1.4);
		setDoorState("leaving");
		doorTimer.current = setTimeout(() => setDoorState("outside"), 6e3);
	};
	const onFlightEnd = (arrivedZone) => {
		if (arrivedZone === "door") {
			if (doorTimer.current) clearTimeout(doorTimer.current);
			setAutoSequence(false);
			setDoorState("outside");
		}
	};
	import_react.useEffect(() => {
		if (theme === "3d") document.documentElement.removeAttribute("data-boot-3d");
	}, [theme]);
	if (theme === "3d") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.StrictMode, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bar-shell",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarCanvas, {
				entered,
				zone: zoneForPath(pageContext.urlPathname),
				onFlightEnd
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "bar-hud",
				"data-pagefind-ignore": true,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					className: "bar-mark",
					href: "/",
					children: [
						"Craigory",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						"Coppola"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					"aria-label": "Zones",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							href: "/",
							children: "The Bar"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							href: "/blog/1",
							children: "The Booth"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							href: "/projects",
							children: "The Shelves"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							href: "/presentations",
							children: "Talk Story"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							href: "/tools",
							children: "Tools"
						})
					]
				})]
			}), doorState !== "leaving" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "bar-zone-panel",
					children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeLinks, {})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "bar-exit",
					onClick: leave,
					"aria-label": "Step outside",
					title: "Step outside",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FaDoorOpen, { "aria-hidden": true })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "bar-audio",
					onClick: toggleAudio,
					"aria-label": audioOn ? "Mute the bar" : "Unmute the bar",
					title: audioOn ? "Mute the bar" : "Unmute the bar",
					children: audioOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FaVolumeUp, { "aria-hidden": true }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FaVolumeMute, { "aria-hidden": true })
				})
			] })] }),
			doorState !== "inside" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bar-facade-scope",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `facade-layer${doorState === "entering" || doorState === "leaving" ? " is-entered" : ""}${doorState === "knocking" ? " is-knocking" : ""}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Facade, {}), !autoSequence && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "facade-copy",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Craigory Coppola" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "fc-sub",
								children: "Software engineer · Nx core team"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "fc-enter",
								type: "button",
								onClick: enter,
								disabled: doorState === "knocking",
								"aria-busy": doorState === "knocking",
								children: doorState === "knocking" ? "knock, knock…" : "Step inside"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "fc-quiet",
								children: [
									"Here on business?",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setTheme("bar"),
										children: "The plain site"
									}),
									" ",
									"has everything — projects, talks, writing — without the bar."
								]
							})
						]
					})]
				})
			})
		]
	}) });
	if (theme === "minimal") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.StrictMode, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "minimal-shell",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				"data-pagefind-ignore": true,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						href: "/",
						children: "Home"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						href: "/projects",
						children: "Projects"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						href: "/tools",
						children: "Tools"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						href: "/presentations",
						children: "Speaking"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						href: "/blog/1",
						children: "Blog"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", { children }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				"data-pagefind-ignore": true,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					href: "/privacy",
					children: "Privacy"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeLinks, {})]
			})
		]
	}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.StrictMode, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SpotlightProvider, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Layout$1, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sidebar, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sidebar-nav",
			"data-pagefind-ignore": true,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpotlightTrigger, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					className: "navitem",
					href: "/",
					children: "Home"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					className: "navitem",
					href: "/projects",
					children: "Projects"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					className: "navitem",
					href: "/tools",
					children: "Tools"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					className: "navitem",
					href: "/presentations",
					children: "Speaking + Presentations"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					className: "navitem",
					href: `/blog/1`,
					children: "Blog"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sidebar-footer",
			"data-pagefind-ignore": true,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				className: "footer-link",
				href: "/privacy",
				children: "Privacy Policy"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeLinks, {})]
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, { children })] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileNav, { children }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {})
	] }) });
}
function Layout$1({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "layout",
		children
	});
}
function Sidebar({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "sidebar",
		children
	});
}
function Content({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "content",
		children
	});
}
//#endregion
//#region renderer/+Layout.tsx
var _Layout_exports = /* @__PURE__ */ __exportAll({ Layout: () => Layout });
function Layout({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, { children });
}
//#endregion
export { FaCalendar as a, FaGlobe as c, FaBook as i, FaStar as l, IoClose as n, FaExternalLinkAlt as o, Link as r, FaGithub as s, _Layout_exports as t, GenIcon as u };
