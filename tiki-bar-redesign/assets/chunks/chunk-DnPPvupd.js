//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/unique.js
function unique(arr) {
	return Array.from(new Set(arr));
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/getGlobalObject.js
/**
* Share information across module instances.
*
* @__NO_SIDE_EFFECTS__
*/
function getGlobalObject(moduleId, defaultValue) {
	const globals = getGlobals();
	return globals[moduleId] ?? (globals[moduleId] = defaultValue);
}
function getGlobals() {
	var _a;
	globalThis._vike ?? (globalThis._vike = {});
	(_a = globalThis._vike).globals ?? (_a.globals = {});
	return globalThis._vike.globals;
}
//#endregion
//#region ../../node_modules/.pnpm/@brillout+picocolors@1.0.30/node_modules/@brillout/picocolors/dist/picocolors.browser.js
var picocolors_browser_default = new Proxy({}, { get: (_, p) => (s) => {
	if (p === "code") return `\`${s}\``;
	if (p === "string") return `'${s}'`;
	return s;
} });
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/PROJECT_VERSION.js
var PROJECT_VERSION = "0.4.258";
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/assertSingleInstance.js
var globalObject$10;
globalObject$10 ?? (globalObject$10 = genGlobalConfig());
function genGlobalConfig() {
	return getGlobalObject("utils/assertSingleInstance.ts", {
		instances: [],
		alreadyLogged: /* @__PURE__ */ new Set()
	});
}
function getGlobalObjectSafe() {
	globalObject$10 ?? (globalObject$10 = genGlobalConfig());
	return globalObject$10;
}
var clientRuntimesClonflict = "Client runtime of both Server Routing and Client Routing loaded https://vike.dev/client-runtimes-conflict";
var clientNotSingleInstance = "Client runtime loaded twice https://vike.dev/client-runtime-duplicated";
function assertSingleInstance() {
	const globalObject = getGlobalObjectSafe();
	{
		const versions = unique(globalObject.instances);
		assertWarning$1(versions.length <= 1, `vike@${picocolors_browser_default.bold(versions[0])} and vike@${picocolors_browser_default.bold(versions[1])} loaded which is highly discouraged ${picocolors_browser_default.underline("https://vike.dev/warning/version-mismatch")}`, {
			onlyOnce: true,
			showStackTrace: false
		});
	}
	if (globalObject.checkSingleInstance && globalObject.instances.length > 1) assertWarning$1(false, clientNotSingleInstance, {
		onlyOnce: true,
		showStackTrace: true
	});
}
function assertSingleInstance_onClientEntryClientRouting(isProduction) {
	const globalObject = getGlobalObjectSafe();
	assertWarning$1(globalObject.isClientRouting !== false, clientRuntimesClonflict, {
		onlyOnce: true,
		showStackTrace: true
	});
	assertWarning$1(globalObject.isClientRouting === void 0, clientNotSingleInstance, {
		onlyOnce: true,
		showStackTrace: true
	});
	globalObject.isClientRouting = true;
	if (isProduction) globalObject.checkSingleInstance = true;
	assertSingleInstance();
}
function assertSingleInstance_onAssertModuleLoad() {
	getGlobalObjectSafe().instances.push(PROJECT_VERSION);
	assertSingleInstance();
}
function assertWarning$1(condition, errorMessage, { onlyOnce, showStackTrace }) {
	const globalObject = getGlobalObjectSafe();
	if (condition) return;
	const msg = `[Vike][Warning] ${errorMessage}`;
	if (onlyOnce) {
		const { alreadyLogged } = globalObject;
		const key = onlyOnce === true ? msg : onlyOnce;
		if (alreadyLogged.has(key)) return;
		else alreadyLogged.add(key);
	}
	if (showStackTrace) console.warn(new Error(msg));
	else console.warn(msg);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/isNodeJS.js
function isNodeJS() {
	if (typeof process === "undefined") return false;
	if (!process.cwd) return false;
	if (!process.versions || typeof process.versions.node === "undefined") return false;
	if (!process.release || process.release.name !== "node") return false;
	return true;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/createErrorWithCleanStackTrace.js
function createErrorWithCleanStackTrace(errorMessage, numberOfStackTraceLinesToRemove) {
	const err = new Error(errorMessage);
	if (isNodeJS()) err.stack = clean(err.stack, numberOfStackTraceLinesToRemove);
	return err;
}
function clean(errStack, numberOfStackTraceLinesToRemove) {
	if (!errStack) return errStack;
	const stackLines = splitByLine(errStack);
	let linesRemoved = 0;
	return stackLines.filter((line) => {
		if (line.includes(" (internal/") || line.includes(" (node:internal")) return false;
		if (linesRemoved < numberOfStackTraceLinesToRemove && isStackTraceLine(line)) {
			linesRemoved++;
			return false;
		}
		return true;
	}).join("\n");
}
function isStackTraceLine(line) {
	return line.startsWith("    at ");
}
function splitByLine(str) {
	return str.split(/\r?\n/);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/colorsClient.js
function colorVike(str) {
	return picocolors_browser_default.bold(picocolors_browser_default.yellow(str));
}
function colorError(str) {
	return picocolors_browser_default.bold(picocolors_browser_default.red(str));
}
function colorWarning(str) {
	return picocolors_browser_default.yellow(str);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/assert.js
var globalObject$9 = getGlobalObject("utils/assert.ts", { alreadyLogged: /* @__PURE__ */ new Set() });
assertSingleInstance_onAssertModuleLoad();
var tagVike = `[vike]`;
var tagVikeWithVersion = `[vike@${PROJECT_VERSION}]`;
var tagTypeBug = "Bug";
function assert(condition, debugInfo) {
	if (condition) return;
	const debugStr = (() => {
		if (!debugInfo) return null;
		const debugInfoSerialized = typeof debugInfo === "string" ? debugInfo : JSON.stringify(debugInfo);
		return picocolors_browser_default.dim(`Debug for maintainers (you can ignore this): ${debugInfoSerialized}`);
	})();
	let errMsg = [`You stumbled upon a Vike bug. Go to ${picocolors_browser_default.underline("https://github.com/vikejs/vike/issues/new?template=bug.yml")} and copy-paste this error. A maintainer will fix the bug (usually within 24 hours).`, debugStr].filter(Boolean).join(" ");
	errMsg = addTags(errMsg, tagTypeBug, true);
	const internalError = createError(errMsg);
	globalObject$9.onBeforeLog?.();
	globalObject$9.onBeforeErr?.(internalError);
	throw internalError;
}
function assertUsage(condition, errMsg, { showStackTrace, exitOnError } = {}) {
	if (condition) return;
	showStackTrace = showStackTrace || globalObject$9.alwaysShowStackTrace;
	errMsg = addTags(errMsg, "Wrong Usage");
	const usageError = createError(errMsg);
	globalObject$9.onBeforeLog?.();
	globalObject$9.onBeforeErr?.(usageError);
	if (!exitOnError) throw usageError;
	else {
		console.error(showStackTrace ? usageError : errMsg);
		process.exit(1);
	}
}
function getProjectError(errMsg) {
	errMsg = addTags(errMsg, "Error");
	return createError(errMsg);
}
function assertWarning(condition, msg, { onlyOnce, showStackTrace }) {
	if (condition) return;
	showStackTrace = showStackTrace || globalObject$9.alwaysShowStackTrace;
	if (onlyOnce) {
		const { alreadyLogged } = globalObject$9;
		const key = onlyOnce === true ? msg : onlyOnce;
		if (alreadyLogged.has(key)) return;
		alreadyLogged.add(key);
	}
	const msgWithTags = addTags(msg, "Warning");
	globalObject$9.onBeforeLog?.();
	if (showStackTrace) {
		const err = createError(msgWithTags);
		globalObject$9.onBeforeErr?.(err);
		console.warn(err);
	} else console.warn(msgWithTags);
}
function assertInfo(condition, msg, { onlyOnce }) {
	if (condition) return;
	msg = addTags(msg, null);
	if (onlyOnce) {
		const { alreadyLogged } = globalObject$9;
		const key = msg;
		if (alreadyLogged.has(key)) return;
		else alreadyLogged.add(key);
	}
	globalObject$9.onBeforeLog?.();
	console.log(msg);
}
function addTags(msg, tagType, showProjectVersion = false) {
	const tagVike = getTagVike(showProjectVersion);
	const tagTypeOuter = getTagType(tagType);
	const whitespace = getTagWhitespace(msg);
	if (globalObject$9.addAssertTagsDev) return `${globalObject$9.addAssertTagsDev(tagVike, tagTypeOuter)}${whitespace}${msg}`;
	else return `${`${tagVike}${tagTypeOuter}`}${whitespace}${msg}`;
}
function getTagWhitespace(msg) {
	if (msg.startsWith("[")) return "";
	else return " ";
}
function getTagType(tagType) {
	if (!tagType) return "";
	let tag = `[${tagType}]`;
	if (tagType === "Warning") tag = colorWarning(tag);
	else tag = colorError(tag);
	return tag;
}
function getTagVike(showProjectVersion = false) {
	return colorVike(showProjectVersion ? tagVikeWithVersion : tagVike);
}
function createError(errMsg) {
	const err = createErrorWithCleanStackTrace(errMsg, 3);
	if (globalObject$9.addAssertTagsDev) err.stack = err.stack?.replace(/^Error:\s*/, "");
	return err;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/humanizeTime.js
function humanizeTime(milliseconds) {
	const seconds = milliseconds / 1e3;
	if (seconds < 120) {
		const n = round(seconds);
		return `${n} second${plural(n)}`;
	}
	{
		const n = round(seconds / 60);
		return `${n} minute${plural(n)}`;
	}
}
function round(n) {
	let rounded = n.toFixed(1);
	if (rounded.endsWith(".0")) rounded = rounded.slice(0, -2);
	return rounded;
}
function plural(n) {
	return n === "1" ? "" : "s";
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/isObject.js
function isObject(value) {
	return typeof value === "object" && value !== null;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/isArray.js
function isArray(value) {
	return Array.isArray(value);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/page-configs/helpers.js
function getPageConfig(pageId, pageConfigs) {
	const pageConfig = pageConfigs.find((p) => p.pageId === pageId);
	assert(pageConfigs.length > 0);
	assert(pageConfig);
	return pageConfig;
}
function getConfigValueFilePathToShowToUser(definedAtData) {
	if (!definedAtData || isArray(definedAtData) || definedAtData.definedBy) return null;
	const { filePathToShowToUser } = definedAtData;
	assert(filePathToShowToUser);
	return filePathToShowToUser;
}
function getHookFilePathToShowToUser(definedAtData) {
	const filePathToShowToUser = getConfigValueFilePathToShowToUser(definedAtData);
	assert(filePathToShowToUser);
	return filePathToShowToUser;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/getValuePrintable.js
function getValuePrintable(value) {
	if ([null, void 0].includes(value)) return String(value);
	if ([
		"boolean",
		"number",
		"string"
	].includes(typeof value)) return JSON.stringify(value);
	return null;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/page-configs/getExportPath.js
function getExportPath(fileExportPathToShowToUser, configName) {
	if (!fileExportPathToShowToUser) return null;
	let [exportName, ...exportObjectPath] = fileExportPathToShowToUser;
	if (!exportName) return null;
	if (exportObjectPath.length === 0 && [
		"*",
		"default",
		configName
	].includes(exportName)) return null;
	assert(exportName !== "*");
	let prefix = "";
	let suffix = "";
	if (exportName === "default") prefix = "export default";
	else {
		prefix = "export";
		exportObjectPath = [exportName, ...exportObjectPath];
	}
	exportObjectPath.forEach((prop) => {
		prefix = `${prefix} { ${prop}`;
		suffix = ` }${suffix}`;
	});
	return prefix + suffix;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/page-configs/getConfigDefinedAt.js
function getConfigDefinedAt(sentenceBegin, configName, definedAtData) {
	return `${begin(sentenceBegin, configName)} at ${getDefinedAtString(definedAtData, configName)}`;
}
function getConfigDefinedAtOptional(sentenceBegin, configName, definedAtData) {
	if (!definedAtData) return `${begin(sentenceBegin, configName)} internally`;
	else return `${begin(sentenceBegin, configName)} at ${getDefinedAtString(definedAtData, configName)}`;
}
function begin(sentenceBegin, configName) {
	return `${sentenceBegin} ${picocolors_browser_default.cyan(configName)} defined`;
}
function getDefinedAtString(definedAtData, configName) {
	let files;
	if (isArray(definedAtData)) files = definedAtData;
	else files = [definedAtData];
	assert(files.length >= 1);
	return files.map((definedAt) => {
		if (definedAt.definedBy) return getDefinedByString(definedAt, configName);
		const { filePathToShowToUser, fileExportPathToShowToUser } = definedAt;
		const exportPath = getExportPath(fileExportPathToShowToUser, configName);
		if (exportPath) return `${filePathToShowToUser} > ${picocolors_browser_default.cyan(exportPath)}`;
		else return filePathToShowToUser;
	}).join(" / ");
}
function getDefinedByString(definedAt, configName) {
	if (definedAt.definedBy === "api") return `API call ${picocolors_browser_default.cyan(`${definedAt.operation}({ vikeConfig: { ${configName} } })`)}`;
	const { definedBy } = definedAt;
	if (definedBy === "cli") return `CLI option ${picocolors_browser_default.cyan(`--${configName}`)}`;
	if (definedBy === "env") return `environment variable ${picocolors_browser_default.cyan(`VIKE_CONFIG="{${configName}}"`)}`;
	assert(false);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/page-configs/getConfigValueTyped.js
function getConfigValueTyped(configValue, configName, type) {
	const { value, definedAtData } = configValue;
	if (type) assertConfigValueType(value, type, configName, definedAtData);
	return configValue;
}
function assertConfigValueType(value, type, configName, definedAtData) {
	assert(value !== null);
	const typeActual = typeof value;
	if (typeActual === type) return;
	const valuePrintable = getValuePrintable(value);
	const problem = valuePrintable !== null ? `value ${picocolors_browser_default.cyan(valuePrintable)}` : `type ${picocolors_browser_default.cyan(typeActual)}`;
	assertUsage(false, `${getConfigDefinedAtOptional("Config", configName, definedAtData)} has an invalid ${problem}: it should be a ${picocolors_browser_default.cyan(type)} instead`);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/page-configs/getConfigValueRuntime.js
function getConfigValueRuntime(pageConfig, configName, type) {
	const configValue = pageConfig.configValues[configName];
	if (!configValue) return null;
	return getConfigValueTyped(configValue, configName, type);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/isCallable.js
function isCallable(thing) {
	return thing instanceof Function || typeof thing === "function";
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/hooks/getHook.js
var globalObject$8 = getGlobalObject("hooks/getHook.ts", {});
function getHookFromPageContext(pageContext, hookName) {
	if (!(hookName in pageContext.exports)) return null;
	const { hooksTimeout } = pageContext.config;
	const hookTimeout = getHookTimeout(hooksTimeout, hookName);
	const hookFn = pageContext.exports[hookName];
	if (hookFn === null) return null;
	const file = pageContext.exportsAll[hookName][0];
	assert(file.exportValue === hookFn);
	const hookFilePath = file.filePath;
	assert(hookFilePath);
	return getHook(hookFn, hookName, hookFilePath, hookTimeout);
}
function getHooksFromPageContextNew(hookName, pageContext) {
	const { hooksTimeout } = pageContext.config;
	const hookTimeout = getHookTimeout(hooksTimeout, hookName);
	const hooks = [];
	pageContext.exportsAll[hookName]?.forEach((val) => {
		const hookFn = val.exportValue;
		if (hookFn === null) return;
		const hookFilePath = val.filePath;
		assert(hookFilePath);
		hooks.push(getHook(hookFn, hookName, hookFilePath, hookTimeout));
	});
	return hooks;
}
function getHookFromPageConfigGlobal(pageConfigGlobal, hookName) {
	const configValue = pageConfigGlobal.configValues[hookName];
	if (!configValue?.value) return null;
	const { hookFn, hookFilePath } = getHookFromConfigValue(configValue);
	return getHook(hookFn, hookName, hookFilePath, getHookTimeoutGlobal(hookName));
}
function getHooksFromPageConfigGlobalCumulative(pageConfigGlobal, hookName) {
	const configValue = pageConfigGlobal.configValues[hookName];
	if (!configValue?.value) return [];
	const val = configValue.value;
	assert(isArray(val));
	return val.map((v, i) => {
		const hookFn = v;
		const hookTimeout = getHookTimeoutGlobal(hookName);
		assert(isArray(configValue.definedAtData));
		return getHook(hookFn, hookName, getHookFilePathToShowToUser(configValue.definedAtData[i]), hookTimeout);
	});
}
function getHookTimeoutGlobal(hookName) {
	return getHookTimeoutDefault(hookName);
}
function getHook(hookFn, hookName, hookFilePath, hookTimeout) {
	assert(hookFilePath);
	assertHookFn(hookFn, {
		hookName,
		hookFilePath
	});
	return {
		hookFn,
		hookName,
		hookFilePath,
		hookTimeout
	};
}
function getHookFromConfigValue(configValue) {
	const hookFn = configValue.value;
	assert(hookFn);
	return {
		hookFn,
		hookFilePath: getHookFilePathToShowToUser(configValue.definedAtData)
	};
}
function assertHookFn(hookFn, { hookName, hookFilePath }) {
	assert(hookName && hookFilePath);
	assert(!hookName.endsWith(")"));
	assert(!hookFilePath.endsWith(" "));
	assertUsage(isCallable(hookFn), `Hook ${hookName}() defined by ${hookFilePath} should be a function`);
}
function getHookTimeout(hooksTimeoutProvidedByUser, hookName) {
	const hooksTimeoutProvidedbyUserNormalized = getHooksTimeoutProvidedByUserNormalized(hooksTimeoutProvidedByUser);
	if (hooksTimeoutProvidedbyUserNormalized === false) return {
		error: false,
		warning: false
	};
	const providedbyUser = hooksTimeoutProvidedbyUserNormalized[hookName];
	const hookTimeout = getHookTimeoutDefault(hookName);
	if (providedbyUser?.error !== void 0) hookTimeout.error = providedbyUser.error;
	if (providedbyUser?.warning !== void 0) hookTimeout.warning = providedbyUser.warning;
	return hookTimeout;
}
function getHooksTimeoutProvidedByUserNormalized(hooksTimeoutProvidedByUser) {
	if (hooksTimeoutProvidedByUser === void 0) return {};
	if (hooksTimeoutProvidedByUser === false) return false;
	assertUsage(isObject(hooksTimeoutProvidedByUser), `Setting ${picocolors_browser_default.cyan("hooksTimeout")} should be ${picocolors_browser_default.cyan("false")} or an object`);
	const hooksTimeoutProvidedByUserNormalized = {};
	Object.entries(hooksTimeoutProvidedByUser).forEach(([hookName, hookTimeoutProvidedbyUser]) => {
		if (hookTimeoutProvidedbyUser === false) {
			hooksTimeoutProvidedByUserNormalized[hookName] = {
				error: false,
				warning: false
			};
			return;
		}
		assertUsage(isObject(hookTimeoutProvidedbyUser), `Setting ${picocolors_browser_default.cyan(`hooksTimeout.${hookName}`)} should be ${picocolors_browser_default.cyan("false")} or an object`);
		const [error, warning] = ["error", "warning"].map((timeoutName) => {
			const timeoutVal = hookTimeoutProvidedbyUser[timeoutName];
			if (timeoutVal === void 0 || timeoutVal === false) return timeoutVal;
			const errPrefix = `Setting ${picocolors_browser_default.cyan(`hooksTimeout.${hookName}.${timeoutName}`)} should be`;
			assertUsage(typeof timeoutVal === "number", `${errPrefix} ${picocolors_browser_default.cyan("false")} or a number`);
			assertUsage(timeoutVal > 0, `${errPrefix} a positive number`);
			return timeoutVal;
		});
		hooksTimeoutProvidedByUserNormalized[hookName] = {
			error,
			warning
		};
	});
	return hooksTimeoutProvidedByUserNormalized;
}
function getHookTimeoutDefault(hookName) {
	if (hookName === "onBeforeRoute") return {
		error: 5 * 1e3,
		warning: 1 * 1e3
	};
	if (globalObject$8.isPrerendering) return {
		error: 120 * 1e3,
		warning: 30 * 1e3
	};
	else assert(!hookName.toLowerCase().includes("prerender"));
	return {
		error: 30 * 1e3,
		warning: 4 * 1e3
	};
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/isPropertyGetter.js
function isPropertyGetter(obj, prop) {
	const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
	return !!descriptor && !("value" in descriptor) && !!descriptor.get;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/addIs404ToPageProps.js
function addIs404ToPageProps(pageContext) {
	addIs404(pageContext);
}
function addIs404(pageContext) {
	if (pageContext.is404 === void 0 || pageContext.is404 === null) return;
	const pageProps = pageContext.pageProps || {};
	if (!isObject(pageProps)) {
		assertWarning(false, "pageContext.pageProps should be an object", {
			showStackTrace: true,
			onlyOnce: true
		});
		return;
	}
	pageProps.is404 = pageProps.is404 || pageContext.is404;
	pageContext.pageProps = pageProps;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/getPropAccessNotation.js
function getPropAccessNotation(key) {
	return typeof key === "string" && isKeyDotNotationCompatible(key) ? `.${key}` : `[${JSON.stringify(key)}]`;
}
function isKeyDotNotationCompatible(key) {
	return /^[a-z0-9\$_]+$/i.test(key);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/isBrowser.js
/** Test whether the environment is a *real* browser (not a browser simulation such as `jsdom`). */
function isBrowser() {
	return Object.getOwnPropertyDescriptor(globalThis, "window")?.get?.toString().includes("[native code]") ?? false;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/getPublicProxy.js
function getPublicProxy(obj, objName, skipOnInternalProp, fallback) {
	return new Proxy(obj, { get: (_, prop) => getProp(prop, obj, objName, skipOnInternalProp, fallback) });
}
function getProp(prop, ...args) {
	const [obj, objName, skipOnInternalProp, fallback] = args;
	const propStr = String(prop);
	if (prop === "_isProxyObject") return true;
	if (prop === "dangerouslyUseInternals") {
		args[2] = true;
		return getPublicProxy(...args);
	}
	if (!skipOnInternalProp) {}
	if (prop === "_originalObject") return obj;
	if (fallback && !(prop in obj)) return fallback(prop);
	const val = obj[prop];
	onNotSerializable(propStr, val, objName);
	return val;
}
function onNotSerializable(propStr, val, objName) {
	if (val !== "__VIKE__NOT_SERIALIZABLE__") return;
	const propName = getPropAccessNotation(propStr);
	assert(isBrowser());
	assertUsage(false, `Can't access ${objName}${propName} on the client side. Because it can't be serialized, see server logs.`);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/getGlobalContextPublicShared.js
function getGlobalContextPublicShared(globalContext) {
	assert(globalContext._isOriginalObject);
	return getPublicProxy(globalContext, "globalContext");
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/getPageContextPublicShared.js
function getPageContextPublicShared(pageContext) {
	assert(!pageContext._isProxyObject);
	assert(!pageContext.globalContext);
	assert(pageContext._isOriginalObject);
	addIs404ToPageProps(pageContext);
	if (!("_pageId" in pageContext)) Object.defineProperty(pageContext, "_pageId", {
		get() {
			assertWarning(false, "pageContext._pageId has been renamed to pageContext.pageId", {
				showStackTrace: true,
				onlyOnce: true
			});
			return pageContext.pageId;
		},
		enumerable: false
	});
	const globalContextPublic = getGlobalContextPublicShared(pageContext._globalContext);
	return getPublicProxy(pageContext, "pageContext", true, (prop) => {
		if (prop === "globalContext") return globalContextPublic;
		if (prop in globalContextPublic) return globalContextPublic[prop];
	});
}
function assertPropertyGetters(pageContext) {
	[
		"urlPathname",
		"urlParsed",
		"url",
		"pageExports"
	].forEach((prop) => {
		if (pageContext.prop) assert(isPropertyGetter(pageContext, prop));
	});
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/hooks/execHook.js
var globalObject$7 = getGlobalObject("utils/execHook.ts", {
	userHookErrors: /* @__PURE__ */ new WeakMap(),
	pageContext: null
});
async function execHook(hookName, pageContext, getPageContextPublic) {
	return await execHookList(getHooksFromPageContextNew(hookName, pageContext), pageContext, getPageContextPublic);
}
async function execHookGlobal(hookName, globalContext, getGlobalContextPublic) {
	const hooks = getHooksFromPageConfigGlobalCumulative(globalContext._pageConfigGlobal, hookName);
	const globalContextPublic = getGlobalContextPublic(globalContext);
	await Promise.all(hooks.map(async (hook) => {
		await execHookBaseAsync(() => hook.hookFn(globalContextPublic), hook, globalContext, null);
	}));
}
async function execHookList(hooks, pageContext, getPageContextPublic) {
	if (!hooks.length) return [];
	const pageContextPublic = getPageContextPublic(pageContext);
	return await Promise.all(hooks.map(async (hook) => {
		const hookReturn = await execHookBaseAsync(() => hook.hookFn(pageContextPublic), hook, pageContext._globalContext, pageContextPublic);
		return {
			...hook,
			hookReturn
		};
	}));
}
async function execHookSingle(hook, pageContext, getPageContextPublic) {
	const { hookReturn } = (await execHookList([hook], pageContext, getPageContextPublic))[0];
	assertUsage(hookReturn === void 0, `The ${hook.hookName}() hook defined by ${hook.hookFilePath} isn't allowed to return a value`);
}
function isUserHookError(err) {
	if (!isObject(err)) return false;
	return globalObject$7.userHookErrors.get(err) ?? false;
}
function execHookSingleSync(hook, globalContext, pageContext, getPageContextPublic, hookFnCaller) {
	const pageContextPublic = pageContext && getPageContextPublic(pageContext);
	hookFnCaller ?? (hookFnCaller = () => hook.hookFn(pageContextPublic));
	return { hookReturn: execHookBase(hookFnCaller, hook, globalContext, pageContextPublic) };
}
function execHookBaseAsync(hookFnCaller, hook, globalContext, pageContextPublic) {
	const { hookName, hookFilePath, hookTimeout: { error: timeoutErr, warning: timeoutWarn } } = hook;
	let resolve;
	let reject;
	const promise = new Promise((resolve_, reject_) => {
		resolve = (ret) => {
			clearTimeouts();
			resolve_(ret);
		};
		reject = (err) => {
			clearTimeouts();
			reject_(err);
		};
	});
	const clearTimeouts = () => {
		if (currentTimeoutWarn) clearTimeout(currentTimeoutWarn);
		if (currentTimeoutErr) clearTimeout(currentTimeoutErr);
	};
	const currentTimeoutWarn = isNotDisabled(timeoutWarn) && setTimeout(() => {
		assertWarning(false, `The ${hookName}() hook defined by ${hookFilePath} is slow: it's taking more than ${humanizeTime(timeoutWarn)} (https://vike.dev/hooksTimeout)`, { onlyOnce: false });
	}, timeoutWarn);
	const currentTimeoutErr = isNotDisabled(timeoutErr) && setTimeout(() => {
		const err = getProjectError(`The ${hookName}() hook defined by ${hookFilePath} timed out: it didn't finish after ${humanizeTime(timeoutErr)} (https://vike.dev/hooksTimeout)`);
		reject(err);
	}, timeoutErr);
	(async () => {
		try {
			const ret = await execHookBase(hookFnCaller, hook, globalContext, pageContextPublic);
			resolve(ret);
		} catch (err) {
			if (isObject(err)) globalObject$7.userHookErrors.set(err, {
				hookName,
				hookFilePath
			});
			reject(err);
		}
	})();
	return promise;
}
function execHookBase(hookFnCaller, hook, globalContext, pageContext) {
	const { hookName, hookFilePath } = hook;
	assert(hookName !== "onHookCall");
	const configValue = globalContext._pageConfigGlobal.configValues["onHookCall"];
	const callOriginal = () => {
		providePageContextInternal(pageContext);
		return hookFnCaller();
	};
	if (!configValue?.value) return callOriginal();
	let originalCalled = false;
	let originalReturn;
	let originalError;
	let call = () => {
		originalCalled = true;
		try {
			originalReturn = callOriginal();
		} catch (err) {
			originalError = err;
			throw err;
		}
		return originalReturn;
	};
	for (const onHookCall of configValue.value) {
		const hookPublic = {
			name: hookName,
			filePath: hookFilePath,
			call
		};
		call = () => {
			(async () => {
				try {
					await onHookCall(hookPublic, pageContext);
				} catch (err) {
					if (err !== originalError) console.error(err);
				}
			})();
			assertUsage(originalCalled, "onHookCall() must run hook.call()");
			return originalReturn;
		};
	}
	call();
	if (originalError) throw originalError;
	return originalReturn;
}
function isNotDisabled(timeout) {
	return !!timeout && timeout !== Infinity;
}
/**
* Provide `pageContext` for universal hooks.
*
* https://vike.dev/getPageContext
*/
function providePageContext(pageContext) {
	providePageContextInternal(pageContext);
}
function providePageContextInternal(pageContext) {
	globalObject$7.pageContext = pageContext;
	Promise.resolve().then(() => {
		globalObject$7.pageContext = null;
	});
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/catchInfiniteLoop.js
var trackers = {};
var maxCalls = 99;
var time = 5 * 1e3;
function catchInfiniteLoop(functionName) {
	const now = (/* @__PURE__ */ new Date()).getTime();
	Object.keys(trackers).forEach((key) => {
		if (now - trackers[key].startTime > time) delete trackers[key];
	});
	const tracker = trackers[functionName] ?? (trackers[functionName] = {
		count: 0,
		startTime: now
	});
	tracker.count++;
	const msg = `${functionName} called ${tracker.count} times within ${humanizeTime(time)} — infinite loop?`;
	if (tracker.count > maxCalls) assertUsage(false, msg);
	if (!tracker.warned && tracker.count > maxCalls * .5) {
		assertWarning(false, msg, {
			onlyOnce: false,
			showStackTrace: true
		});
		tracker.warned = true;
	}
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/genPromise.js
var timeoutDefault = 25 * 1e3;
function genPromise({ timeout = timeoutDefault } = {}) {
	let resolve;
	let reject;
	let finished = false;
	const promise_internal = new Promise((resolve_, reject_) => {
		resolve = (...args) => {
			finished = true;
			timeoutClear();
			return resolve_(...args);
		};
		reject = (...args) => {
			finished = true;
			timeoutClear();
			return reject_(...args);
		};
	});
	const timeoutClear = () => timeouts.forEach((t) => clearTimeout(t));
	const timeouts = [];
	let promise;
	if (!timeout) promise = promise_internal;
	else promise = new Proxy(promise_internal, { get(target, prop) {
		if (prop === "then" && !finished) {
			const err = /* @__PURE__ */ new Error(`Promise hasn't resolved after ${humanizeTime(timeout)}`);
			timeouts.push(setTimeout(() => {
				assert(err.stack);
				assertWarning(false, removeStackErrorPrefix(err.stack), { onlyOnce: false });
			}, timeout));
		}
		const value = Reflect.get(target, prop);
		return typeof value === "function" ? value.bind(target) : value;
	} });
	return {
		promise,
		resolve,
		reject
	};
}
function removeStackErrorPrefix(errStack) {
	if (errStack.startsWith("Error: ")) errStack = errStack.slice(7);
	return errStack;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/isArrayOfStrings.js
function isArrayOfStrings(val) {
	return isArray(val) && val.every((v) => typeof v === "string");
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/isObjectOfStrings.js
function isObjectOfStrings(val) {
	return isObject(val) && Object.values(val).every((v) => typeof v === "string");
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/hasProp.js
function hasProp(obj, prop, type) {
	if (!isObject(obj)) return false;
	if (!(prop in obj)) return type === "undefined";
	if (type === void 0) return true;
	const propValue = obj[prop];
	if (type === "undefined") return propValue === void 0;
	if (type === "array") return isArray(propValue);
	if (type === "object") return isObject(propValue);
	if (type === "string[]") return isArrayOfStrings(propValue);
	if (type === "string{}") return isObjectOfStrings(propValue);
	if (type === "function") return isCallable(propValue);
	if (isArray(type)) return typeof propValue === "string" && type.includes(propValue);
	if (type === "null") return propValue === null;
	if (type === "true") return propValue === true;
	if (type === "false") return propValue === false;
	return typeof propValue === type;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/objectAssign.js
function objectAssign(obj, objAddendum, objAddendumCanBeOriginalObject) {
	if (!objAddendum) return;
	if (!objAddendumCanBeOriginalObject) assert(!objAddendum._isOriginalObject);
	Object.defineProperties(obj, Object.getOwnPropertyDescriptors(objAddendum));
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/redirectHard.js
function redirectHard(url) {
	window.location.href = url;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/updateType.js
/** Help TypeScript update the type of dynamically modified objects. */
function updateType(thing, clone) {
	assert(thing === clone);
}
//#endregion
//#region ../../node_modules/.pnpm/@brillout+json-serializer@0.5.22/node_modules/@brillout/json-serializer/dist/types.js
var types = [
	ts({
		is: (val) => val === void 0,
		match: (str) => str === "!undefined",
		serialize: () => "!undefined",
		deserialize: () => void 0
	}),
	ts({
		is: (val) => val === Infinity,
		match: (str) => str === "!Infinity",
		serialize: () => "!Infinity",
		deserialize: () => Infinity
	}),
	ts({
		is: (val) => val === -Infinity,
		match: (str) => str === "!-Infinity",
		serialize: () => "!-Infinity",
		deserialize: () => -Infinity
	}),
	ts({
		is: (val) => typeof val === "number" && isNaN(val),
		match: (str) => str === "!NaN",
		serialize: () => "!NaN",
		deserialize: () => NaN
	}),
	ts({
		is: (val) => val instanceof Date,
		match: (str) => str.startsWith("!Date:"),
		serialize: (val) => "!Date:" + val.toISOString(),
		deserialize: (str) => new Date(str.slice(6))
	}),
	ts({
		is: (val) => typeof val === "bigint",
		match: (str) => str.startsWith("!BigInt:"),
		serialize: (val) => "!BigInt:" + val.toString(),
		deserialize: (str) => {
			if (typeof BigInt === "undefined") throw new Error("Your JavaScript environement does not support BigInt. Consider adding a polyfill.");
			return BigInt(str.slice(8));
		}
	}),
	ts({
		is: (val) => val instanceof RegExp,
		match: (str) => str.startsWith("!RegExp:"),
		serialize: (val) => "!RegExp:" + val.toString(),
		deserialize: (str) => {
			str = str.slice(8);
			const args = str.match(/\/(.*)\/(.*)?/);
			const pattern = args[1];
			const flags = args[2];
			return new RegExp(pattern, flags);
		}
	}),
	ts({
		is: (val) => val instanceof Map,
		match: (str) => str.startsWith("!Map:"),
		serialize: (val, serializer) => "!Map:" + serializer(Array.from(val.entries())),
		deserialize: (str, parser) => new Map(parser(str.slice(5)))
	}),
	ts({
		is: (val) => val instanceof Set,
		match: (str) => str.startsWith("!Set:"),
		serialize: (val, serializer) => "!Set:" + serializer(Array.from(val.values())),
		deserialize: (str, parser) => new Set(parser(str.slice(5)))
	}),
	ts({
		is: (val) => typeof val === "string" && val.startsWith("!"),
		match: (str) => str.startsWith("!"),
		serialize: (val) => "!" + val,
		deserialize: (str) => str.slice(1)
	})
];
function ts(t) {
	return t;
}
//#endregion
//#region ../../node_modules/.pnpm/@brillout+json-serializer@0.5.22/node_modules/@brillout/json-serializer/dist/parse.js
function parse(str, options = {}) {
	return parseTransform(JSON.parse(str), options);
}
function parseTransform(value, options = {}) {
	if (typeof value === "string") return reviver(value, options);
	if (typeof value === "object" && value !== null) Object.entries(value).forEach(([key, val]) => {
		value[key] = parseTransform(val, options);
	});
	return value;
}
function reviver(value, options) {
	const parser = (str) => parse(str, options);
	{
		const res = options.reviver?.(void 0, value, parser);
		if (res) if (typeof res.replacement !== "string") return res.replacement;
		else {
			value = res.replacement;
			if (res.resolved) return value;
		}
	}
	for (const { match, deserialize } of types) if (match(value)) return deserialize(value, parser);
	return value;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/htmlElementIds.js
var htmlElementId_pageContext = "vike_pageContext";
var htmlElementId_globalContext = "vike_globalContext";
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/assertIsBrowser.js
function assertIsBrowser() {
	assert(isBrowser());
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/assertEnvClient.js
assertEnvClient();
function assertEnvClient() {
	assertIsBrowser();
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/shared/getJsonSerializedInHtml.js
function getPageContextSerializedInHtml() {
	const pageContextSerializedInHtml = findAndParseJson(htmlElementId_pageContext);
	assert(hasProp(pageContextSerializedInHtml, "pageId", "string"));
	assert(hasProp(pageContextSerializedInHtml, "routeParams", "string{}"));
	return pageContextSerializedInHtml;
}
function getGlobalContextSerializedInHtml() {
	return findAndParseJson(htmlElementId_globalContext);
}
function findAndParseJson(id) {
	const elem = document.getElementById(id);
	assertUsage(elem, `Couldn't find #${id} (which Vike automatically injects in the HTML): make sure it exists (i.e. don't remove it and make sure your HTML isn't malformed)`);
	const jsonStr = elem.textContent;
	assert(jsonStr);
	return parse(jsonStr, { reviver(_key, value) {
		if (typeof value === "string") return {
			replacement: value.replaceAll("\\/", "/"),
			resolved: false
		};
	} });
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/isNullish.js
function isNullish(val) {
	return val === null || val === void 0;
}
function isNotNullish(p) {
	return !isNullish(p);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/getPageFiles/getAllPageIdFiles.js
function getPageFilesClientSide(pageFilesAll, pageId) {
	return determine(pageFilesAll, pageId, true);
}
function getPageFilesServerSide(pageFilesAll, pageId) {
	return determine(pageFilesAll, pageId, false);
}
function determine(pageFilesAll, pageId, envIsClient) {
	const env = envIsClient ? "CLIENT_ONLY" : "SERVER_ONLY";
	const pageFilesRelevant = pageFilesAll.filter((p) => p.isRelevant(pageId) && p.fileType !== ".page.route").sort(getPageFilesSorter(envIsClient, pageId));
	const getPageIdFile = (iso) => {
		const files = pageFilesRelevant.filter((p) => p.pageId === pageId && p.isEnv(iso ? "CLIENT_AND_SERVER" : env));
		assertUsage(files.length <= 1, `Merge the following files into a single file: ${files.map((p) => p.filePath).join(" ")}`);
		const pageIdFile = files[0];
		assert(pageIdFile === void 0 || !pageIdFile.isDefaultPageFile);
		return pageIdFile;
	};
	const pageIdFileEnv = getPageIdFile(false);
	const pageIdFileIso = getPageIdFile(true);
	const getRendererFile = (iso) => pageFilesRelevant.filter((p) => p.isRendererPageFile && p.isEnv(iso ? "CLIENT_AND_SERVER" : env))[0];
	const rendererFileEnv = getRendererFile(false);
	const rendererFileIso = getRendererFile(true);
	return [
		pageIdFileEnv,
		pageIdFileIso,
		...pageFilesRelevant.filter((p) => p.isDefaultPageFile && !p.isRendererPageFile && (p.isEnv(env) || p.isEnv("CLIENT_AND_SERVER"))),
		rendererFileEnv,
		rendererFileIso
	].filter(isNotNullish);
}
function getPageFilesSorter(envIsClient, pageId) {
	const env = envIsClient ? "CLIENT_ONLY" : "SERVER_ONLY";
	const e1First = -1;
	const e2First = 1;
	const noOrder = 0;
	return (e1, e2) => {
		if (!e1.isDefaultPageFile && e2.isDefaultPageFile) return e1First;
		if (!e2.isDefaultPageFile && e1.isDefaultPageFile) return e2First;
		{
			const e1_isRenderer = e1.isRendererPageFile;
			const e2_isRenderer = e2.isRendererPageFile;
			if (!e1_isRenderer && e2_isRenderer) return e1First;
			if (!e2_isRenderer && e1_isRenderer) return e2First;
			assert(e1_isRenderer === e2_isRenderer);
		}
		{
			const e1_distance = getPathDistance(pageId, e1.filePath);
			const e2_distance = getPathDistance(pageId, e2.filePath);
			if (e1_distance < e2_distance) return e1First;
			if (e2_distance < e1_distance) return e2First;
			assert(e1_distance === e2_distance);
		}
		if (e1.isEnv(env) && e2.isEnv("CLIENT_AND_SERVER")) return e1First;
		if (e2.isEnv(env) && e1.isEnv("CLIENT_AND_SERVER")) return e2First;
		return noOrder;
	};
}
function getPathDistance(pathA, pathB) {
	let idx = 0;
	for (; idx < pathA.length && idx < pathB.length; idx++) if (pathA[idx] !== pathB[idx]) break;
	const pathAWithoutCommon = pathA.slice(idx);
	const pathBWithoutCommon = pathB.slice(idx);
	return pathAWithoutCommon.split("/").length + pathBWithoutCommon.split("/").length;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/getPageFiles/analyzePageServerSide.js
async function analyzePageServerSide(pageFilesAll, pageId) {
	const pageFilesServerSideOnly = getPageFilesServerSide(pageFilesAll, pageId).filter((p) => p.fileType === ".page.server");
	await Promise.all(pageFilesServerSideOnly.map(async (p) => {
		if (p.exportNames) return;
		assert(p.loadExportNames, pageId);
		await p.loadExportNames();
	}));
	return { hasOnBeforeRenderServerSideOnlyHook: pageFilesServerSideOnly.some(({ exportNames }) => {
		assert(exportNames);
		return exportNames.includes("onBeforeRender");
	}) };
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/getPageContext/removeBuiltInOverrides.js
var BUILT_IN_CLIENT_ROUTER = ["urlPathname", "urlParsed"];
var BUILT_IN_CLIENT = [
	"Page",
	"pageExports",
	"exports"
];
function removeBuiltInOverrides(pageContext) {
	[...BUILT_IN_CLIENT, ...BUILT_IN_CLIENT_ROUTER].forEach((prop) => {
		if (prop in pageContext) {
			if (BUILT_IN_CLIENT_ROUTER.includes(prop)) {
				assert(prop.startsWith("url"));
				assertWarning(false, `pageContext.${prop} is already available in the browser when using Client Routing; adding '${prop}' to passToClient has no effect`, { onlyOnce: true });
			} else assertWarning(false, `pageContext.${prop} is a built-in that cannot be overridden; adding '${prop}' to passToClient has no effect`, { onlyOnce: true });
			delete pageContext[prop];
		}
	});
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/slice.js
function slice(thing, from, to) {
	if (typeof thing === "string") return sliceArray(thing.split(""), from, to).join("");
	else return sliceArray(thing, from, to);
}
function sliceArray(list, from, to) {
	const listSlice = [];
	let start = from >= 0 ? from : list.length + from;
	assert(start >= 0 && start <= list.length);
	let end = to >= 0 ? to : list.length + to;
	assert(end >= 0 && end <= list.length);
	while (true) {
		if (start === end) break;
		if (start === list.length) start = 0;
		if (start === end) break;
		const el = list[start];
		assert(el !== void 0);
		listSlice.push(el);
		start++;
	}
	return listSlice;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/parseUrl.js
function parseUrl(url, baseServer) {
	assert(isUrl(url), url);
	assert(baseServer.startsWith("/"));
	const { hashString: hashOriginal, withoutHash: urlWithoutHash } = extractHash(url);
	assert(hashOriginal === null || hashOriginal.startsWith("#"));
	const hash = hashOriginal === null ? "" : decodeSafe(hashOriginal.slice(1));
	const { searchString: searchOriginal, withoutSearch: urlWithoutHashNorSearch } = extractSearch(urlWithoutHash);
	assert(searchOriginal === null || searchOriginal.startsWith("?"));
	let searchString = "";
	if (searchOriginal !== null) searchString = searchOriginal;
	else if (url.startsWith("#")) {
		const baseURI = getBaseURI();
		searchString = baseURI && extractSearch(baseURI).searchString || "";
	}
	const search = {};
	const searchAll = {};
	Array.from(new URLSearchParams(searchString)).forEach(([key, val]) => {
		search[key] = val;
		searchAll[key] = [...searchAll.hasOwnProperty(key) ? searchAll[key] : [], val];
	});
	let { protocol, origin, pathnameAbsoluteWithBase } = getPathnameAbsoluteWithBase(urlWithoutHashNorSearch, baseServer);
	const pathnameOriginal = urlWithoutHashNorSearch.slice((origin || "").length);
	assertUrlComponents(url, origin, pathnameOriginal, searchOriginal, hashOriginal);
	let { pathname, isBaseMissing } = removeBaseServer(pathnameAbsoluteWithBase, baseServer);
	const href = createUrlFromComponents(origin, pathname, searchOriginal, hashOriginal);
	const { hostname, port } = parseHost(!origin ? null : origin.slice(protocol.length), url);
	pathname = decodePathname(pathname);
	assert(pathname.startsWith("/"));
	return {
		href,
		protocol,
		hostname,
		port,
		origin,
		pathname,
		pathnameOriginal,
		isBaseMissing,
		search,
		searchAll,
		searchOriginal,
		hash,
		hashOriginal
	};
}
function extractHash(url) {
	const [withoutHash, ...parts] = url.split("#");
	return {
		hashString: ["", ...parts].join("#") || null,
		withoutHash
	};
}
function extractSearch(url) {
	const [withoutSearch, ...parts] = url.split("?");
	return {
		searchString: ["", ...parts].join("?") || null,
		withoutSearch
	};
}
function decodeSafe(urlComponent) {
	try {
		return decodeURIComponent(urlComponent);
	} catch {}
	try {
		return decodeURI(urlComponent);
	} catch {}
	return urlComponent;
}
function decodePathname(urlPathname) {
	urlPathname = urlPathname.replace(/\s+$/, "");
	urlPathname = urlPathname.split("/").map((dir) => decodeSafe(dir).split("/").join("%2F")).join("/");
	return urlPathname;
}
function getPathnameAbsoluteWithBase(url, baseServer) {
	assert(!url.includes("?") && !url.includes("#"));
	{
		const { protocol, origin, pathname } = parseOrigin(url);
		if (origin) return {
			protocol,
			origin,
			pathnameAbsoluteWithBase: pathname
		};
		assert(pathname === url);
	}
	if (url.startsWith("/")) return {
		protocol: null,
		origin: null,
		pathnameAbsoluteWithBase: url
	};
	else {
		const baseURI = getBaseURI();
		let base;
		if (baseURI) base = parseOrigin(baseURI.split("?")[0].split("#")[0]).pathname;
		else base = baseServer;
		return {
			protocol: null,
			origin: null,
			pathnameAbsoluteWithBase: resolveUrlPathnameRelative(url, base)
		};
	}
}
function getBaseURI() {
	return typeof window !== "undefined" ? window?.document?.baseURI : void 0;
}
function parseOrigin(url) {
	if (!isUrlWithWebProtocol(url)) return {
		pathname: url,
		origin: null,
		protocol: null
	};
	else {
		const { protocol, uriWithoutProtocol } = parseProtocol(url);
		assert(protocol);
		const [host, ...rest] = uriWithoutProtocol.split("/");
		const origin = protocol + host;
		return {
			pathname: "/" + rest.join("/"),
			origin,
			protocol
		};
	}
}
function parseHost(host, url) {
	const ret = {
		hostname: null,
		port: null
	};
	if (!host) return ret;
	const parts = host.split(":");
	if (parts.length > 1) {
		const port = parseInt(parts.pop(), 10);
		assert(port || port === 0, url);
		ret.port = port;
	}
	ret.hostname = parts.join(":");
	return ret;
}
function parseProtocol(uri) {
	const SEP = ":";
	const [before, ...after] = uri.split(SEP);
	if (after.length === 0 || !/^[a-z][a-z0-9\+\-]*$/i.test(before)) return {
		protocol: null,
		uriWithoutProtocol: uri
	};
	let protocol = before + SEP;
	let uriWithoutProtocol = after.join(SEP);
	const SEP2 = "//";
	if (uriWithoutProtocol.startsWith(SEP2)) {
		protocol = protocol + SEP2;
		uriWithoutProtocol = uriWithoutProtocol.slice(2);
	}
	return {
		protocol,
		uriWithoutProtocol
	};
}
function isWebUrlProtocol(protocol) {
	if (["ipfs://", "ipns://"].includes(protocol)) return false;
	return protocol.endsWith("://");
}
function resolveUrlPathnameRelative(pathnameRelative, base) {
	const stack = base.split("/");
	const parts = pathnameRelative.split("/");
	let baseRestoreTrailingSlash = base.endsWith("/");
	if (pathnameRelative.startsWith(".")) stack.pop();
	for (const i in parts) {
		const p = parts[i];
		if (p == "" && i === "0") continue;
		if (p == ".") continue;
		if (p == "..") stack.pop();
		else {
			baseRestoreTrailingSlash = false;
			stack.push(p);
		}
	}
	let pathnameAbsolute = stack.join("/");
	if (baseRestoreTrailingSlash && !pathnameAbsolute.endsWith("/")) pathnameAbsolute += "/";
	if (!pathnameAbsolute.startsWith("/")) pathnameAbsolute = "/" + pathnameAbsolute;
	return pathnameAbsolute;
}
function removeBaseServer(pathnameAbsoluteWithBase, baseServer) {
	assert(pathnameAbsoluteWithBase.startsWith("/"));
	assert(isBaseServer$1(baseServer));
	let urlPathname = pathnameAbsoluteWithBase;
	assert(urlPathname.startsWith("/"));
	assert(baseServer.startsWith("/"));
	if (baseServer === "/") return {
		pathname: pathnameAbsoluteWithBase,
		isBaseMissing: false
	};
	let baseServerNormalized = baseServer;
	if (baseServer.endsWith("/") && urlPathname === slice(baseServer, 0, -1)) {
		baseServerNormalized = slice(baseServer, 0, -1);
		assert(urlPathname === baseServerNormalized);
	}
	if (!urlPathname.startsWith(baseServerNormalized)) return {
		pathname: pathnameAbsoluteWithBase,
		isBaseMissing: true
	};
	assert(urlPathname.startsWith("/") || urlPathname.startsWith("http"));
	assert(urlPathname.startsWith(baseServerNormalized));
	urlPathname = urlPathname.slice(baseServerNormalized.length);
	if (!urlPathname.startsWith("/")) urlPathname = "/" + urlPathname;
	assert(urlPathname.startsWith("/"));
	return {
		pathname: urlPathname,
		isBaseMissing: false
	};
}
function isBaseServer$1(baseServer) {
	return baseServer.startsWith("/");
}
function assertUrlComponents(url, origin, pathnameOriginal, searchOriginal, hashOriginal) {
	assert(url === createUrlFromComponents(origin, pathnameOriginal, searchOriginal, hashOriginal));
}
function createUrlFromComponents(origin, pathname, search, hash) {
	return `${origin || ""}${pathname}${search || ""}${hash || ""}`;
}
function isUrl(url) {
	return isUrlAbsolute(url) || isUrlRelative(url);
}
function isUrlAbsolute(url) {
	return isUrlPathAbsolute(url) || isUrlWithWebProtocol(url);
}
function isUrlPathAbsolute(url) {
	return url.startsWith("/");
}
function isUrlRelative(url) {
	return [
		".",
		"?",
		"#"
	].some((c) => url.startsWith(c)) || url === "";
}
function isUrlExternal(url) {
	return !url.startsWith("/") && !isUrlRelative(url);
}
function isUrlWithWebProtocol(url) {
	const { protocol } = parseProtocol(url);
	return !!protocol && isWebUrlProtocol(protocol);
}
function assertUsageUrlAbsolute(url, errPrefix) {
	assertUsage(isUrlAbsolute(url), getErrMsg(url, errPrefix, true));
}
function getErrMsg(url, errPrefix, allowProtocol, allowUri) {
	let errMsg = `${errPrefix} is ${picocolors_browser_default.string(url)} but it should start with ${picocolors_browser_default.string("/")}`;
	if (allowProtocol) errMsg += ` or a protocol (e.g. ${picocolors_browser_default.string("http://")})`;
	if (allowUri) errMsg += `, or be ${picocolors_browser_default.string("*")}`;
	return errMsg;
}
function urlToFile(url, fileExtension, doNotCreateExtraDirectory) {
	const { pathnameOriginal, searchOriginal, hashOriginal } = parseUrl(url, "/");
	if (url.startsWith("/")) assert(url === `${pathnameOriginal}${searchOriginal || ""}${hashOriginal || ""}`, { url });
	const hasTrailingSlash = pathnameOriginal.endsWith("/");
	let pathnameModified;
	if (doNotCreateExtraDirectory && pathnameOriginal !== "/") {
		if (hasTrailingSlash) pathnameModified = slice(pathnameOriginal, 0, -1);
		else pathnameModified = pathnameOriginal;
		assert(!pathnameModified.endsWith("/"), { url });
		assert(pathnameModified !== "");
	} else pathnameModified = pathnameOriginal + (hasTrailingSlash ? "" : "/") + "index";
	assert(pathnameModified);
	pathnameModified = pathnameModified + fileExtension;
	return `${pathnameModified}${searchOriginal || ""}${hashOriginal || ""}`;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/getPageContextRequestUrl.js
var pageContextJsonFileExtension = ".pageContext.json";
function getPageContextRequestUrl(url) {
	return urlToFile(url, pageContextJsonFileExtension, false);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/isPlainObject.js
function isPlainObject(value) {
	if (typeof value !== "object" || value === null) return false;
	if (Object.getPrototypeOf(value) === null) return true;
	return value.constructor.name === "Object";
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/assertPageContextProvidedByUser.js
function assertPageContextProvidedByUser(pageContextProvidedByUser, { hookName, hookFilePath }) {
	if (pageContextProvidedByUser === void 0 || pageContextProvidedByUser === null) return;
	assert(!hookName.endsWith(")"));
	const errPrefix = `The ${picocolors_browser_default.cyan("pageContext")} object provided by the ${hookName}() hook defined by ${hookFilePath}`;
	assertUsage(isObject(pageContextProvidedByUser), `${errPrefix} should be an object (but it's ${picocolors_browser_default.cyan(`typeof pageContext === ${JSON.stringify(typeof pageContextProvidedByUser)}`)} instead)`);
	assertUsage(!("isPageContext" in pageContextProvidedByUser), `${errPrefix} shouldn't be the whole ${picocolors_browser_default.cyan("pageContext")} object, see https://vike.dev/pageContext-manipulation#do-not-return-entire-pagecontext`);
	assertWarning(!("pageId" in pageContextProvidedByUser), `${errPrefix} sets ${picocolors_browser_default.cyan("pageContext.pageId")} which means that Vike's routing is overridden. This is an experimental feature: make sure to contact a vike maintainer before using this.`, { onlyOnce: true });
	assertUsage(!("is404" in pageContextProvidedByUser), `${errPrefix} sets ${picocolors_browser_default.cyan("pageContext.is404")} which is forbidden, use ${picocolors_browser_default.cyan("throw render()")} instead, see https://vike.dev/render`);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/stringifyStringArray.js
function stringifyStringArray(stringList) {
	return "[" + stringList.map((str) => "'" + str + "'").join(", ") + "]";
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/assertHookReturnedObject.js
function assertHookReturnedObject(obj, keysExpected, errPrefix) {
	assert(!errPrefix.endsWith(" "));
	const keysUnknown = [];
	const keys = Object.keys(obj);
	for (const key of keys) if (!keysExpected.includes(key)) keysUnknown.push(key);
	assertUsage(keysUnknown.length === 0, [
		errPrefix,
		"returned an object with following unknown keys:",
		stringifyStringArray(keysUnknown) + ".",
		"Only following keys are allowed:",
		stringifyStringArray(keysExpected) + "."
	].join(" "));
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/assertOnBeforeRenderHookReturn.js
function assertOnBeforeRenderHookReturn(hookReturnValue, hookFilePath) {
	if (hookReturnValue === void 0 || hookReturnValue === null) return;
	const errPrefix = `The onBeforeRender() hook defined by ${hookFilePath}`;
	assertUsage(isPlainObject(hookReturnValue), `${errPrefix} should return a plain JavaScript object, ${picocolors_browser_default.cyan("undefined")}, or ${picocolors_browser_default.cyan("null")}`);
	assertHookReturnedObject(hookReturnValue, ["pageContext"], errPrefix);
	if (hookReturnValue.pageContext) assertPageContextProvidedByUser(hookReturnValue["pageContext"], {
		hookName: "onBeforeRender",
		hookFilePath
	});
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/route/execHookGuard.js
var errIntro = "The guard() hook defined by";
async function execHookGuard(pageContext, getPageContextPublic) {
	let hook;
	if (pageContext._globalContext._pageFilesAll.length > 0) {
		assert(pageContext._globalContext._pageConfigs.length === 0);
		hook = findPageGuard(pageContext.pageId, pageContext._globalContext._pageFilesAll);
	} else hook = getHookFromPageContext(pageContext, "guard");
	if (!hook) return;
	await execHookSingle(hook, pageContext, getPageContextPublic);
}
function findPageGuard(pageId, pageFilesAll) {
	const pageRouteFile = pageFilesAll.find((p) => p.pageId === pageId && p.fileType === ".page.route");
	if (!pageRouteFile) return null;
	const { filePath, fileExports } = pageRouteFile;
	assert(fileExports);
	const hookFn = fileExports.guard;
	if (!hookFn) return null;
	const hookFilePath = filePath;
	const hookTimeout = getHookTimeoutDefault("guard");
	assertUsage(isCallable(hookFn), `${errIntro} ${hookFilePath} should be a function`);
	return {
		hookFn,
		hookName: "guard",
		hookFilePath,
		hookTimeout
	};
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/joinEnglish.js
function joinEnglish(arr, conjunction, { color = (s) => s, trailingComma = true } = {}) {
	assert(arr.length > 0);
	if (arr.length === 1) return color(arr[0]);
	const firsts = arr.slice(0, arr.length - 1);
	const last = arr[arr.length - 1];
	const lastComma = trailingComma && arr.length > 2 ? "," : "";
	return firsts.map(color).join(", ") + `${lastComma} ${conjunction} ` + color(last);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/route/abort.js
function AbortRender(pageContextAbort) {
	const err = /* @__PURE__ */ new Error("AbortRender");
	objectAssign(err, {
		_pageContextAbort: pageContextAbort,
		[stamp]: true
	});
	return err;
}
var stamp = "_isAbortError";
function isAbortError(thing) {
	return typeof thing === "object" && thing !== null && stamp in thing;
}
function isAbortPageContext(pageContext) {
	if (!(pageContext._urlRewrite || pageContext._urlRedirect || pageContext.abortStatusCode)) return false;
	assert(hasProp(pageContext, "_abortCall", "string"));
	return true;
}
function logAbort(err, isProduction, pageContext) {
	if (isProduction) return;
	const urlCurrent = pageContext._urlRewrite ?? pageContext.urlOriginal;
	assert(urlCurrent);
	const abortCall = err._pageContextAbort._abortCall;
	assert(abortCall);
	const hookLoc = isUserHookError(err);
	let thrownBy = "";
	if (hookLoc) thrownBy = ` by ${picocolors_browser_default.cyan(`${hookLoc.hookName}()`)} hook defined at ${hookLoc.hookFilePath}`;
	assertInfo(false, `${picocolors_browser_default.cyan(abortCall)} thrown${thrownBy} while rendering ${picocolors_browser_default.cyan(urlCurrent)}`, { onlyOnce: false });
}
function getPageContextAddendumAbort(pageContextsAborted) {
	const pageContextAbortedLast = pageContextsAborted.at(-1);
	if (!pageContextAbortedLast) return null;
	const pageContextAbort = pageContextAbortedLast._pageContextAbort;
	assert(pageContextAbort);
	return pageContextAbort;
}
function addNewPageContextAborted(pageContextsAborted, pageContext, pageContextAbort) {
	objectAssign(pageContext, { _pageContextAbort: pageContextAbort });
	pageContextsAborted.push(pageContext);
	assertNoInfiniteAbortLoop(pageContextsAborted);
}
function assertNoInfiniteAbortLoop(pageContextsAborted) {
	if (pageContextsAborted.length < 10) return;
	const loop = pageContextsAborted.map((pageContext) => {
		return pageContext._pageContextAbort._abortCall;
	});
	if (unique(loop).length === loop.length) return;
	assertUsage(false, `Infinite loop: ${loop.join(" => ")}`);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/misc/isServerSideError.js
var isServerSideError = "_isServerSideError";
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/shared/getPageContextPublicClientShared.js
function getPageContextPublicClientShared(pageContext) {
	objectAssign(pageContext, { Page: pageContext.config?.Page || pageContext.exports?.Page });
	assertPropertyGetters(pageContext);
	supportVueReactiviy(pageContext);
	return getPageContextPublicClientMinimal(pageContext);
}
function getPageContextPublicClientMinimal(pageContext) {
	return getPageContextPublicShared(pageContext);
}
function supportVueReactiviy(pageContext) {
	resolveGetters(pageContext);
}
function resolveGetters(pageContext) {
	Object.entries(pageContext).forEach(([key, val]) => {
		delete pageContext[key];
		pageContext[key] = val;
	});
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/getPageContextPublicClient.js
function getPageContextPublicClient(pageContext) {
	return getPageContextPublicClientShared(pageContext);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/getPageContextFromHooks.js
var globalObject$6 = getGlobalObject("getPageContextFromHooks.ts", {});
var clientHooks = [
	"guard",
	"data",
	"onBeforeRender"
];
function getPageContextFromHooksServer_firstRender() {
	const pageContextSerialized = getPageContextSerializedInHtml();
	processPageContextFromServer(pageContextSerialized);
	objectAssign(pageContextSerialized, { _hasPageContextFromServer: true });
	return pageContextSerialized;
}
async function getPageContextFromHooksClient_firstRender(pageContext) {
	for (const hookName of clientHooks) {
		if (!hookClientOnlyExists(hookName, pageContext)) continue;
		if (hookName === "guard") await execHookGuardClient(pageContext);
		else await execHookDataLike(hookName, pageContext);
	}
	return pageContext;
}
async function getPageContextFromHooksServer(pageContext, isErrorPage) {
	const pageContextFromHooksServer = { _hasPageContextFromServer: false };
	if (!isErrorPage && await hasPageContextServer(pageContext)) {
		const res = await fetchPageContextFromServer(pageContext);
		if ("is404ServerSideRouted" in res) return { is404ServerSideRouted: true };
		const { pageContextFromServer } = res;
		pageContextFromHooksServer._hasPageContextFromServer = true;
		assert(!(isServerSideError in pageContextFromServer));
		assert(!("serverSideError" in pageContextFromServer));
		objectAssign(pageContextFromHooksServer, pageContextFromServer);
	}
	return { pageContextFromHooksServer };
}
async function getPageContextFromHooksClient(pageContext, isErrorPage) {
	let dataHookExecuted = false;
	for (const hookName of clientHooks) {
		if (!hookClientOnlyExists(hookName, pageContext) && pageContext._hasPageContextFromServer) continue;
		if (hookName === "guard") {
			if (isErrorPage) continue;
			await execHookGuardClient(pageContext);
		} else {
			if (hookName === "data") dataHookExecuted = true;
			await execHookDataLike(hookName, pageContext);
		}
	}
	const dataHookEnv = getHookEnv("data", pageContext);
	if (dataHookExecuted && dataHookEnv.client || pageContext._hasPageContextFromServer && dataHookEnv.server) await execHookClient("onData", pageContext);
	return pageContext;
}
async function execHookClient(hookName, pageContext) {
	return await execHook(hookName, pageContext, (p) => getPageContextPublicClient(p));
}
async function execHookDataLike(hookName, pageContext) {
	let pageContextFromHook;
	if (hookName === "data") pageContextFromHook = await execHookData(pageContext);
	else pageContextFromHook = await execHookOnBeforeRender(pageContext);
	Object.assign(pageContext, pageContextFromHook);
}
async function execHookData(pageContext) {
	const hook = (await execHookClient("data", pageContext))[0];
	if (!hook) return;
	const { hookReturn } = hook;
	return { data: hookReturn };
}
async function execHookOnBeforeRender(pageContext) {
	const hook = (await execHookClient("onBeforeRender", pageContext))[0];
	if (!hook) return;
	const { hookReturn, hookFilePath } = hook;
	const pageContextFromHook = {};
	assertOnBeforeRenderHookReturn(hookReturn, hookFilePath);
	const pageContextFromOnBeforeRender = hookReturn?.pageContext;
	if (pageContextFromOnBeforeRender) objectAssign(pageContextFromHook, pageContextFromOnBeforeRender);
	return pageContextFromHook;
}
function setPageContextInitIsPassedToClient(pageContext) {
	if (pageContext["_pageContextInitIsPassedToClient"]) globalObject$6.pageContextInitIsPassedToClient = true;
}
async function hasPageContextServer(pageContext) {
	if (isOldDesign(pageContext)) {
		const { hasOnBeforeRenderServerSideOnlyHook } = await analyzePageServerSide(pageContext._pageFilesAll, pageContext.pageId);
		return hasOnBeforeRenderServerSideOnlyHook;
	}
	return !!globalObject$6.pageContextInitIsPassedToClient || hasServerOnlyHook(pageContext);
}
function hasServerOnlyHook(pageContext) {
	if (isOldDesign(pageContext)) return false;
	const val = getConfigValueRuntime(getPageConfig(pageContext.pageId, pageContext._globalContext._pageConfigs), `hasServerOnlyHook`)?.value;
	assert(val === true || val === false);
	return val;
}
function hookClientOnlyExists(hookName, pageContext) {
	const hookEnv = getHookEnv(hookName, pageContext);
	return !!hookEnv.client && !hookEnv.server;
}
function getHookEnv(hookName, pageContext) {
	if (isOldDesign(pageContext)) return {
		client: false,
		server: true
	};
	return getConfigValueRuntime(getPageConfig(pageContext.pageId, pageContext._globalContext._pageConfigs), `${hookName}Env`)?.value ?? {};
}
async function fetchPageContextFromServer(pageContext) {
	let pageContextUrl = getPageContextRequestUrl(pageContext._urlRewrite ?? pageContext.urlOriginal);
	const response = await fetch(pageContextUrl);
	{
		const contentType = response.headers.get("content-type");
		const contentTypeCorrect = "application/json";
		const isCorrect = contentType && contentType.includes(contentTypeCorrect);
		if (!isCorrect && response.status === 404) {
			redirectHard(pageContext.urlOriginal);
			return { is404ServerSideRouted: true };
		}
		assertUsage(isCorrect, `Wrong Content-Type for ${pageContextUrl}: it should be ${contentTypeCorrect} but it's ${contentType} instead. Make sure to properly use pageContext.httpResponse.headers, see https://vike.dev/renderPage`);
	}
	const pageContextFromServer = parse(await response.text());
	assert(isObject(pageContextFromServer));
	if (isAbortPageContext(pageContextFromServer)) throw AbortRender(pageContextFromServer);
	if ("serverSideError" in pageContextFromServer || "_isServerSideError" in pageContextFromServer) throw getProjectError(`pageContext couldn't be fetched because an error occurred on the server-side`);
	processPageContextFromServer(pageContextFromServer);
	return { pageContextFromServer };
}
function processPageContextFromServer(pageContext) {
	assertUsage(!("urlOriginal" in pageContext), "Adding 'urlOriginal' to passToClient is forbidden");
	assert(hasProp(pageContext, "pageId", "string"));
	removeBuiltInOverrides(pageContext);
}
function isOldDesign(pageContext) {
	return pageContext._globalContext._pageConfigs.length === 0;
}
async function execHookGuardClient(pageContext) {
	await execHookGuard(pageContext, (pageContext) => getPageContextPublicClient(pageContext));
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/changeEnumerable.js
/** Change enumerability of an object property. */
function changeEnumerable(obj, prop, enumerable) {
	Object.defineProperty(obj, prop, {
		...Object.getOwnPropertyDescriptor(obj, prop),
		enumerable
	});
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/createPageContextShared.js
function createPageContextShared(pageContextCreated, globalConfigPublic) {
	objectAssign(pageContextCreated, globalConfigPublic);
	return pageContextCreated;
}
function createPageContextObject() {
	const pageContext = {
		_isOriginalObject: true,
		isPageContext: true
	};
	changeEnumerable(pageContext, "_isOriginalObject", false);
	return pageContext;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/objectDefineProperty.js
function objectDefineProperty(obj, prop, { get, ...args }) {
	Object.defineProperty(obj, prop, {
		...args,
		get
	});
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/getPageContextUrlComputed.js
function getPageContextUrlComputed(pageContext) {
	assert(typeof pageContext.urlOriginal === "string");
	assertPropertyGetters(pageContext);
	const pageContextUrlComputed = {};
	objectDefineProperty(pageContextUrlComputed, "urlPathname", {
		get: urlPathnameGetter,
		enumerable: true,
		configurable: true
	});
	objectDefineProperty(pageContextUrlComputed, "url", {
		get: urlGetter,
		enumerable: false,
		configurable: true
	});
	objectDefineProperty(pageContextUrlComputed, "urlParsed", {
		get: urlParsedGetter,
		enumerable: true,
		configurable: true
	});
	return pageContextUrlComputed;
}
function getUrlParsed(pageContext) {
	const assertUrlResolved = (src) => assert(typeof urlResolved === "string", {
		src,
		urlResolved
	});
	let urlResolved;
	let isBaseToBeRemoved;
	if (pageContext.urlLogical) {
		urlResolved = pageContext.urlLogical;
		isBaseToBeRemoved = false;
		assertUrlResolved(1);
	} else if (pageContext._urlRewrite) {
		urlResolved = pageContext._urlRewrite;
		isBaseToBeRemoved = false;
		assertUrlResolved(2);
	} else {
		urlResolved = pageContext.urlOriginal;
		isBaseToBeRemoved = true;
		assertUrlResolved(3);
	}
	assertUrlResolved(4);
	let urlHandler = pageContext._urlHandler;
	if (!urlHandler) urlHandler = (url) => url;
	urlResolved = urlHandler(urlResolved);
	const baseServer = !isBaseToBeRemoved ? "/" : pageContext._baseServer;
	return parseUrl(urlResolved, baseServer);
}
function urlPathnameGetter() {
	const { pathname } = getUrlParsed(this);
	const urlPathname = pathname;
	assert(urlPathname.startsWith("/"));
	return urlPathname;
}
function urlGetter() {
	assertWarning(false, "`pageContext.url` is outdated. Use `pageContext.urlPathname`, `pageContext.urlParsed`, or `pageContext.urlOriginal` instead. (See https://vike.dev/migration/0.4.23 for more information.)", {
		onlyOnce: true,
		showStackTrace: true
	});
	return urlPathnameGetter.call(this);
}
function urlParsedGetter() {
	const { isBaseMissing: _, ...urlParsed } = getUrlParsed(this);
	const hashIsAvailable = isBrowser();
	const warnHashNotAvailable = (prop) => {
		assertWarning(hashIsAvailable, `pageContext.urlParsed.${prop} isn't available on the server-side (HTTP requests don't include the URL hash)`, {
			onlyOnce: true,
			showStackTrace: true
		});
	};
	const urlParsedEnhanced = {
		...urlParsed,
		get hash() {
			warnHashNotAvailable("hash");
			return urlParsed.hash;
		},
		get hashOriginal() {
			warnHashNotAvailable("hashOriginal");
			return urlParsed.hashOriginal;
		},
		get hashString() {
			assertWarning(false, "pageContext.urlParsed.hashString has been renamed to pageContext.urlParsed.hashOriginal", {
				onlyOnce: true,
				showStackTrace: true
			});
			warnHashNotAvailable("hashString");
			return urlParsed.hashOriginal;
		},
		get searchString() {
			assertWarning(false, "pageContext.urlParsed.searchString has been renamed to pageContext.urlParsed.searchOriginal", {
				onlyOnce: true,
				showStackTrace: true
			});
			return urlParsed.searchOriginal;
		}
	};
	changeEnumerable(urlParsedEnhanced, "hashString", false);
	changeEnumerable(urlParsedEnhanced, "searchString", false);
	if (!hashIsAvailable) {
		changeEnumerable(urlParsedEnhanced, "hash", false);
		changeEnumerable(urlParsedEnhanced, "hashOriginal", false);
	}
	return urlParsedEnhanced;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/getBaseServer.js
function getBaseServer() {
	const baseServer = "/";
	assert(isBaseServer(baseServer));
	return baseServer;
}
function isBaseServer(baseServer) {
	return baseServer.startsWith("/");
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/objectReplace.js
function objectReplace(objOld, objNew, except) {
	Object.keys(objOld).filter((key) => !except?.includes(key)).forEach((key) => delete objOld[key]);
	Object.defineProperties(objOld, Object.getOwnPropertyDescriptors(objNew));
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/cast.js
function cast(_thing) {}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/getPageFiles/assert_exports_old_design.js
var enforceTrue = ["clientRouting"];
function assertExportValues(pageFile) {
	enforceTrue.forEach((exportName) => {
		assert(pageFile.fileExports);
		if (!(exportName in pageFile.fileExports)) return;
		const explainer = `The value of \`${exportName}\` is only allowed to be \`true\`.`;
		assertUsage(pageFile.fileExports[exportName] !== false, `${pageFile.filePath} has \`export { ${exportName} }\` with the value \`false\` which is prohibited: remove \`export { ${exportName} }\` instead. (${explainer})`);
		assertUsage(pageFile.fileExports[exportName] === true, `${pageFile.filePath} has \`export { ${exportName} }\` with a forbidden value. ${explainer}`);
	});
}
var forbiddenDefaultExports = [
	"render",
	"clientRouting",
	"prerender",
	"doNotPrerender"
];
function assertDefaultExports(defaultExportName, filePath) {
	assertUsage(!forbiddenDefaultExports.includes(defaultExportName), `${filePath} has \`export default { ${defaultExportName} }\` which is prohibited, use \`export { ${defaultExportName} }\` instead.`);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/determinePageIdOld.js
function determinePageIdOld(filePath) {
	const pageSuffix = ".page.";
	const pageId = slice(filePath.split(pageSuffix), 0, -1).join(pageSuffix);
	assert(!pageId.includes("\\"));
	return pageId;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/error-page.js
function getErrorPageId(pageFilesAll, pageConfigs) {
	if (pageConfigs.length > 0) {
		const errorPageConfigs = pageConfigs.filter((p) => p.isErrorPage);
		if (errorPageConfigs.length === 0) return null;
		assertUsage(errorPageConfigs.length === 1, "Only one error page can be defined");
		return errorPageConfigs[0].pageId;
	}
	const errorPageIds = unique(pageFilesAll.map(({ pageId }) => pageId).filter((pageId) => isErrorPageId(pageId, false)));
	assertUsage(errorPageIds.length <= 1, `Only one _error.page.js is allowed, but found several: ${errorPageIds.join(" ")}`);
	if (errorPageIds.length > 0) {
		const errorPageId = errorPageIds[0];
		assert(errorPageId);
		return errorPageId;
	}
	return null;
}
function isErrorPageId(pageId, _isV1Design) {
	assert(!pageId.includes("\\"));
	return pageId.includes("/_error");
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/isScriptFile.js
var extJs = [
	"js",
	"cjs",
	"mjs"
];
var extTs = [
	"ts",
	"cts",
	"mts"
];
var extJsOrTs = [...extJs, ...extTs];
var extJsx = [
	"jsx",
	"cjsx",
	"mjsx"
];
var extTsx = [
	"tsx",
	"ctsx",
	"mtsx"
];
var extJsxOrTsx = [...extJsx, ...extTsx];
var extTemplates = [
	"vue",
	"svelte",
	"marko",
	"md",
	"mdx"
];
var scriptFileExtensionList = [
	...extJsOrTs,
	...extJsxOrTsx,
	...extTemplates
];
"" + scriptFileExtensionList.join(",");
function isScriptFile(filePath) {
	return scriptFileExtensionList.some((ext) => filePath.endsWith("." + ext));
}
function isTemplateFile(filePath) {
	return extTemplates.some((ext) => filePath.endsWith("." + ext));
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/getPageFiles/fileTypes.js
var fileTypes = [
	".page",
	".page.server",
	".page.route",
	".page.client",
	".css"
];
function determineFileType(filePath) {
	if (filePath.endsWith(".css")) return ".css";
	assert(isScriptFile(filePath), filePath);
	const parts = filePath.split("/").slice(-1)[0].split(".");
	const suffix1 = parts.slice(-3)[0];
	const suffix2 = parts.slice(-2)[0];
	if (suffix2 === "page") return ".page";
	assert(suffix1 === "page", filePath);
	if (suffix2 === "server") return ".page.server";
	if (suffix2 === "client") return ".page.client";
	if (suffix2 === "route") return ".page.route";
	assert(false, filePath);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/getPageFiles/getPageFileObject.js
function getPageFileObject(filePath) {
	const isRelevant = (pageId) => pageFile.pageId === pageId || pageFile.isDefaultPageFile && (isRendererFilePath(pageFile.filePath) || isAncestorDefaultPage(pageId, pageFile.filePath));
	const fileType = determineFileType(filePath);
	const isEnv = (env) => {
		assert(fileType !== ".page.route");
		if (env === "CLIENT_ONLY") return fileType === ".page.client" || fileType === ".css";
		if (env === "SERVER_ONLY") return fileType === ".page.server";
		if (env === "CLIENT_AND_SERVER") return fileType === ".page";
		assert(false);
	};
	const pageFile = {
		filePath,
		fileType,
		isEnv,
		isRelevant,
		isDefaultPageFile: isDefaultFilePath(filePath),
		isRendererPageFile: fileType !== ".css" && isDefaultFilePath(filePath) && isRendererFilePath(filePath),
		isErrorPageFile: isErrorPageId(filePath, false),
		pageId: determinePageIdOld(filePath)
	};
	return pageFile;
}
function isDefaultFilePath(filePath) {
	if (isErrorPageId(filePath, false)) return false;
	return filePath.includes("/_default");
}
function isRendererFilePath(filePath) {
	return filePath.includes("/renderer/");
}
function isAncestorDefaultPage(pageId, defaultPageFilePath) {
	assert(!pageId.endsWith("/"));
	assert(!defaultPageFilePath.endsWith("/"));
	assert(isDefaultFilePath(defaultPageFilePath));
	const defaultPageDir = slice(defaultPageFilePath.split("/"), 0, -1).filter((filePathSegment) => filePathSegment !== "_default").join("/");
	return pageId.startsWith(defaultPageDir);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/page-configs/assertPlusFileExport.js
var SIDE_EXPORTS_TOLERATE = ["$$registrations", "_rerender_only"];
var SIDE_EXPORTS_DO_NOT_CHECK = [".md", ".mdx"];
var SIDE_EXPORTS_DO_NOT_CHECK_CONFIG = ["server"];
function assertPlusFileExport(fileExports, filePathToShowToUser, configName) {
	const exportNames = Object.keys(fileExports);
	const isValid = (exportName) => exportName === "default" || exportName === configName;
	const exportNamesValid = exportNames.filter(isValid);
	const exportDefault = picocolors_browser_default.code("export default");
	const exportNamed = picocolors_browser_default.code(`export { ${configName} }`);
	if (exportNamesValid.length === 0) assertUsage(false, `${filePathToShowToUser} should define ${exportNamed} or ${exportDefault}`);
	if (exportNamesValid.length === 2) assertUsage(false, `${filePathToShowToUser} is ambiguous: remove ${exportDefault} or ${exportNamed}`);
	assert(exportNamesValid.length === 1);
	if (!(SIDE_EXPORTS_DO_NOT_CHECK_CONFIG.includes(configName) || SIDE_EXPORTS_DO_NOT_CHECK.some((ext) => filePathToShowToUser.endsWith(ext)))) exportNames.filter((e) => !isValid(e)).filter((exportName) => !SIDE_EXPORTS_TOLERATE.includes(exportName)).forEach((exportInvalid) => {
		assertWarning(false, `${filePathToShowToUser} unexpected ${picocolors_browser_default.cyan(`export { ${exportInvalid} }`)}, see https://vike.dev/no-side-exports`, { onlyOnce: true });
	});
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/page-configs/serialize/parsePageConfigsSerialized.js
function parsePageConfigsSerialized(pageConfigsSerialized, pageConfigGlobalSerialized) {
	const pageConfigs = pageConfigsSerialized.map((pageConfigSerialized) => {
		const configValues = parseConfigValuesSerialized(pageConfigSerialized.configValuesSerialized);
		assertRouteConfigValue(configValues);
		return {
			...pageConfigSerialized,
			configValues
		};
	});
	const pageConfigGlobal = { configValues: {} };
	{
		const configValues = parseConfigValuesSerialized(pageConfigGlobalSerialized.configValuesSerialized);
		Object.assign(pageConfigGlobal.configValues, configValues);
	}
	return {
		pageConfigs,
		pageConfigGlobal
	};
}
function assertRouteConfigValue(configValues) {
	const configName = "route";
	const configValue = configValues[configName];
	if (!configValue) return;
	const { value, definedAtData } = configValue;
	const configValueType = typeof value;
	assert(definedAtData);
	const configDefinedAt = getConfigDefinedAt("Config", configName, definedAtData);
	assertUsage(configValueType === "string" || isCallable(value), `${configDefinedAt} has an invalid type '${configValueType}': it should be a string or a function instead, see https://vike.dev/route`);
}
function parseConfigValuesSerialized(configValuesSerialized) {
	const configValues = {};
	Object.entries(configValuesSerialized).forEach(([configName, configValueSeriliazed]) => {
		let configValue;
		if (configValueSeriliazed.type === "cumulative") {
			const { valueSerialized, ...common } = configValueSeriliazed;
			configValue = {
				value: valueSerialized.map((valueSerializedElement, i) => {
					const { value, sideExports } = parseValueSerialized(valueSerializedElement, configName, () => {
						const definedAtFile = configValueSeriliazed.definedAtData[i];
						assert(definedAtFile);
						return definedAtFile;
					});
					addSideExports(sideExports);
					return value;
				}),
				...common
			};
		} else {
			const { valueSerialized, ...common } = configValueSeriliazed;
			const { value, sideExports } = parseValueSerialized(valueSerialized, configName, () => {
				assert(configValueSeriliazed.type !== "computed");
				const { definedAtData } = configValueSeriliazed;
				return Array.isArray(definedAtData) ? definedAtData[0] : definedAtData;
			});
			addSideExports(sideExports);
			configValue = {
				value,
				...common
			};
		}
		configValues[configName] = configValue;
	});
	return configValues;
	function addSideExports(sideExports) {
		sideExports.forEach((sideExport) => {
			const { configName, configValue } = sideExport;
			if (!configValues[configName]) configValues[configName] = configValue;
		});
	}
}
function parseValueSerialized(valueSerialized, configName, getDefinedAtFile) {
	if (valueSerialized.type === "js-serialized") {
		let { value } = valueSerialized;
		value = parseTransform(value);
		return {
			value,
			sideExports: []
		};
	}
	if (valueSerialized.type === "pointer-import") {
		const { value } = valueSerialized;
		return {
			value,
			sideExports: []
		};
	}
	if (valueSerialized.type === "plus-file") {
		const definedAtFile = getDefinedAtFile();
		const { exportValues } = valueSerialized;
		assert(!definedAtFile.definedBy);
		assertPlusFileExport(exportValues, definedAtFile.filePathToShowToUser, configName);
		let value;
		let valueWasFound = false;
		const sideExports = [];
		Object.entries(exportValues).forEach(([exportName, exportValue]) => {
			if (!(exportName !== "default" && exportName !== configName)) {
				value = exportValue;
				assert(!valueWasFound);
				valueWasFound = true;
			} else sideExports.push({
				configName: exportName,
				configValue: {
					type: "standard",
					value: exportValue,
					definedAtData: {
						filePathToShowToUser: definedAtFile.filePathToShowToUser,
						fileExportPathToShowToUser: [exportName]
					}
				}
			});
		});
		assert(valueWasFound);
		return {
			value,
			sideExports
		};
	}
	assert(false);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/assertVirtualFileExports.js
function assertVirtualFileExports(moduleExports, test, moduleId) {
	assert(moduleExports, typeof moduleExports);
	if (!test(moduleExports)) assert(false, {
		moduleExports,
		moduleExportsKeys: getKeys(moduleExports),
		moduleId
	});
}
function getKeys(obj) {
	return [
		...Object.getOwnPropertyNames(obj),
		...Object.getOwnPropertySymbols(obj),
		...Object.keys(obj)
	];
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/getPageFiles/parseVirtualFileExportsGlobalEntry.js
function parseVirtualFileExportsGlobalEntry(virtualFileExportsGlobalEntry) {
	assertVirtualFileExports(virtualFileExportsGlobalEntry, (moduleExports) => "pageFilesLazy" in moduleExports);
	assert(hasProp(virtualFileExportsGlobalEntry, "pageFilesLazy", "object"));
	assert(hasProp(virtualFileExportsGlobalEntry, "pageFilesEager", "object"));
	assert(hasProp(virtualFileExportsGlobalEntry, "pageFilesExportNamesLazy", "object"));
	assert(hasProp(virtualFileExportsGlobalEntry, "pageFilesExportNamesEager", "object"));
	assert(hasProp(virtualFileExportsGlobalEntry.pageFilesLazy, ".page"));
	assert(hasProp(virtualFileExportsGlobalEntry.pageFilesLazy, ".page.client") || hasProp(virtualFileExportsGlobalEntry.pageFilesLazy, ".page.server"));
	assert(hasProp(virtualFileExportsGlobalEntry, "pageFilesList", "string[]"));
	assert(hasProp(virtualFileExportsGlobalEntry, "pageConfigsSerialized"));
	assert(hasProp(virtualFileExportsGlobalEntry, "pageConfigGlobalSerialized"));
	const { pageConfigsSerialized, pageConfigGlobalSerialized } = virtualFileExportsGlobalEntry;
	assertPageConfigsSerialized(pageConfigsSerialized);
	assertPageConfigGlobalSerialized(pageConfigGlobalSerialized);
	const { pageConfigs, pageConfigGlobal } = parsePageConfigsSerialized(pageConfigsSerialized, pageConfigGlobalSerialized);
	const pageFilesMap = {};
	parseGlobResult(virtualFileExportsGlobalEntry.pageFilesLazy).forEach(({ filePath, pageFile, globValue }) => {
		pageFile = pageFilesMap[filePath] = pageFilesMap[filePath] ?? pageFile;
		const loadModule = globValue;
		assertLoadModule(loadModule);
		pageFile.loadFile = async () => {
			if (!("fileExports" in pageFile)) {
				pageFile.fileExports = await loadModule();
				assertExportValues(pageFile);
			}
		};
	});
	parseGlobResult(virtualFileExportsGlobalEntry.pageFilesExportNamesLazy).forEach(({ filePath, pageFile, globValue }) => {
		pageFile = pageFilesMap[filePath] = pageFilesMap[filePath] ?? pageFile;
		const loadModule = globValue;
		assertLoadModule(loadModule);
		pageFile.loadExportNames = async () => {
			if (!("exportNames" in pageFile)) {
				const moduleExports = await loadModule();
				assert(hasProp(moduleExports, "exportNames", "string[]"), pageFile.filePath);
				pageFile.exportNames = moduleExports.exportNames;
			}
		};
	});
	parseGlobResult(virtualFileExportsGlobalEntry.pageFilesEager).forEach(({ filePath, pageFile, globValue }) => {
		pageFile = pageFilesMap[filePath] = pageFilesMap[filePath] ?? pageFile;
		const moduleExports = globValue;
		assert(isObject(moduleExports));
		pageFile.fileExports = moduleExports;
	});
	parseGlobResult(virtualFileExportsGlobalEntry.pageFilesExportNamesEager).forEach(({ filePath, pageFile, globValue }) => {
		pageFile = pageFilesMap[filePath] = pageFilesMap[filePath] ?? pageFile;
		const moduleExports = globValue;
		assert(isObject(moduleExports));
		assert(hasProp(moduleExports, "exportNames", "string[]"), pageFile.filePath);
		pageFile.exportNames = moduleExports.exportNames;
	});
	virtualFileExportsGlobalEntry.pageFilesList.forEach((filePath) => {
		pageFilesMap[filePath] = pageFilesMap[filePath] ?? getPageFileObject(filePath);
	});
	const pageFilesAll = Object.values(pageFilesMap);
	pageFilesAll.forEach(({ filePath }) => {
		assert(!filePath.includes("\\"));
	});
	return {
		pageFilesAll,
		pageConfigs,
		pageConfigGlobal
	};
}
function parseGlobResult(globObject) {
	const ret = [];
	Object.entries(globObject).forEach(([fileType, globFiles]) => {
		cast(fileType);
		assert(fileTypes.includes(fileType));
		assert(isObject(globFiles));
		Object.entries(globFiles).forEach(([filePath, globValue]) => {
			const pageFile = getPageFileObject(filePath);
			assert(pageFile.fileType === fileType);
			ret.push({
				filePath,
				pageFile,
				globValue
			});
		});
	});
	return ret;
}
function assertLoadModule(globValue) {
	assert(isCallable(globValue));
}
function assertPageConfigsSerialized(pageConfigsSerialized) {
	assert(isArray(pageConfigsSerialized));
	pageConfigsSerialized.forEach((pageConfigSerialized) => {
		assert(isObject(pageConfigSerialized));
		assert(hasProp(pageConfigSerialized, "pageId", "string"));
		assert(hasProp(pageConfigSerialized, "routeFilesystem"));
		assert(hasProp(pageConfigSerialized, "configValuesSerialized"));
	});
}
function assertPageConfigGlobalSerialized(pageConfigGlobalSerialized) {
	assert(hasProp(pageConfigGlobalSerialized, "configValuesSerialized"));
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/sorter.js
/**
* ```js
* let arr = [
*   { price: 10 },
*   { price: 1000 },
*   { price: 100 }
* ]
* arr = arr.sort(higherFirst(el => el.price))
* isEqual(arr, [
*   { price: 1000 },
*   { price: 100 },
*   { price: 10 }
* ])
* ```
*/
function higherFirst(getValue) {
	return (element1, element2) => {
		const val1 = getValue(element1);
		const val2 = getValue(element2);
		if (val1 === val2) return 0;
		return val1 > val2 ? -1 : 1;
	};
}
/**
* ```js
* let arr = [
*   { price: 10 },
*   { price: 1000 },
*   { price: 100 }
* ]
* arr = arr.sort(lowerFirst(el => el.price))
* isEqual(arr, [
*   { price: 10 },
*   { price: 100 },
*   { price: 1000 }
* ])
* ```
*/
function lowerFirst(getValue) {
	return (element1, element2) => {
		const val1 = getValue(element1);
		const val2 = getValue(element2);
		if (val1 === val2) return 0;
		return val1 < val2 ? -1 : 1;
	};
}
/**
* ```js
* let arr = [
*  { name: 'iphone', isRocket: false },
*  { name: 'starship', isRocket: true }
* ]
* arr = arr.sort(makeFirst(el => el.isRocket))
* isEqual(arr, [
*  { name: 'starship', isRocket: true },
*  { name: 'iphone', isRocket: false }
* ])
* ```
*/
function makeFirst(getValue) {
	return (element1, element2) => {
		const val1 = getValue(element1);
		const val2 = getValue(element2);
		assert([
			true,
			false,
			null
		].includes(val1));
		assert([
			true,
			false,
			null
		].includes(val2));
		if (val1 === val2) return 0;
		if (val1 === true || val2 === false) return -1;
		if (val2 === true || val1 === false) return 1;
		assert(false);
	};
}
/**
* ```js
* let arr = [
*  { name: 'starship', isRocket: true },
*  { name: 'iphone', isRocket: false }
* ]
* arr = arr.sort(makeLast(el => el.isRocket))
* isEqual(arr, [
*  { name: 'iphone', isRocket: false },
*  { name: 'starship', isRocket: true }
* ])
* ```
*/
function makeLast(getValue) {
	return makeFirst((element) => {
		const val = getValue(element);
		if (val === null) return null;
		else return !val;
	});
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/page-configs/resolveVikeConfigPublic.js
function resolveGlobalConfigPublicPage(pageConfigGlobalValues, pageConfig, pageConfigValues) {
	const pageConfigPublic = getPublicCopy(resolvePageConfigPublic({
		pageConfigGlobalValues,
		pageConfigValues
	}));
	const page = (() => {
		if (!pageConfig.isErrorPage) {
			const route = pageConfigPublic.config.route ?? pageConfig.routeFilesystem.routeString;
			return {
				...pageConfigPublic,
				route
			};
		} else return {
			...pageConfigPublic,
			isErrorPage: true
		};
	})();
	return [pageConfig.pageId, page];
}
function getPublicCopy(configInternal) {
	return {
		config: configInternal.config,
		_source: configInternal.source,
		_sources: configInternal.sources,
		_from: configInternal.from
	};
}
function resolvePageConfigPublic({ pageConfigGlobalValues, pageConfigValues }) {
	return resolveConfigPublic_V1Design({ configValues: {
		...pageConfigGlobalValues,
		...pageConfigValues
	} });
}
function resolvePageContextConfig(pageFiles, pageConfig, pageConfigGlobal) {
	const config = {};
	const configEntries = {};
	const exportsAll = {};
	pageFiles.forEach((pageFile) => {
		getExportValues(pageFile).forEach(({ exportName, exportValue, isFromDefaultExport }) => {
			assert(exportName !== "default");
			exportsAll[exportName] = exportsAll[exportName] ?? [];
			exportsAll[exportName].push({
				exportValue,
				exportSource: `${pageFile.filePath} > ${isFromDefaultExport ? `\`export default { ${exportName} }\`` : `\`export { ${exportName} }\``}`,
				filePath: pageFile.filePath,
				_filePath: pageFile.filePath,
				_fileType: pageFile.fileType,
				_isFromDefaultExport: isFromDefaultExport
			});
		});
	});
	let source;
	let sources;
	let from;
	if (pageConfig) {
		const res = resolvePageConfigPublic({
			pageConfigGlobalValues: pageConfigGlobal.configValues,
			pageConfigValues: pageConfig.configValues
		});
		source = res.source;
		sources = res.sources;
		from = res.from;
		Object.assign(config, res.config);
		Object.assign(configEntries, res.configEntries);
		Object.assign(exportsAll, res.exportsAll);
	} else {
		source = {};
		sources = {};
		from = {
			configsStandard: {},
			configsCumulative: {},
			configsComputed: {}
		};
	}
	const pageExports = {};
	const exports = {};
	Object.entries(exportsAll).forEach(([exportName, values]) => {
		values.forEach(({ exportValue, _fileType, _isFromDefaultExport }) => {
			exports[exportName] = exports[exportName] ?? exportValue;
			if (_fileType === ".page" && !_isFromDefaultExport) {
				if (!(exportName in pageExports)) pageExports[exportName] = exportValue;
			}
		});
	});
	assert(!("default" in exports));
	assert(!("default" in exportsAll));
	const pageContextAddendum = {
		config,
		from,
		source,
		sources,
		configEntries,
		exports,
		exportsAll
	};
	objectDefineProperty(pageContextAddendum, "pageExports", {
		get: () => {
			if (!isBrowser()) assertWarning(false, "pageContext.pageExports is outdated, use pageContext.exports instead", {
				onlyOnce: true,
				showStackTrace: true
			});
			return pageExports;
		},
		enumerable: false,
		configurable: true
	});
	return pageContextAddendum;
}
function resolveGlobalContextConfig(pageConfigs, pageConfigGlobal) {
	return resolveGlobalConfigPublic(pageConfigs, pageConfigGlobal, (c) => c.configValues);
}
function resolveGlobalConfigPublic(pageConfigs, pageConfigGlobal, getConfigValues) {
	const pageConfigGlobalValues = getConfigValues(pageConfigGlobal, true);
	const globalConfigPublicBase = getPublicCopy(resolveConfigPublic_V1Design({ configValues: pageConfigGlobalValues }));
	const pages = Object.fromEntries(pageConfigs.map((pageConfig) => {
		return resolveGlobalConfigPublicPage(pageConfigGlobalValues, pageConfig, getConfigValues(pageConfig));
	}));
	const globalConfigPublic = {
		...globalConfigPublicBase,
		pages
	};
	return {
		...globalConfigPublic,
		_globalConfigPublic: globalConfigPublic
	};
}
function resolveConfigPublic_V1Design(pageConfig) {
	const config = {};
	const configEntries = {};
	const exportsAll = {};
	const source = {};
	const sources = {};
	const from = {
		configsStandard: {},
		configsCumulative: {},
		configsComputed: {}
	};
	const addSrc = (src, configName) => {
		source[configName] = src;
		sources[configName] ?? (sources[configName] = []);
		sources[configName].push(src);
	};
	const addLegacy = (configName, value, definedAtData) => {
		const configValueFilePathToShowToUser = getConfigValueFilePathToShowToUser(definedAtData);
		const configDefinedAt = getConfigDefinedAtOptional("Config", configName, definedAtData);
		configEntries[configName] = configEntries[configName] ?? [];
		configEntries[configName].push({
			configValue: value,
			configDefinedAt,
			configDefinedByFile: configValueFilePathToShowToUser
		});
		const exportName = configName;
		exportsAll[exportName] = exportsAll[exportName] ?? [];
		exportsAll[exportName].push({
			exportValue: value,
			exportSource: configDefinedAt,
			filePath: configValueFilePathToShowToUser,
			_filePath: configValueFilePathToShowToUser,
			_fileType: null,
			_isFromDefaultExport: null
		});
	};
	Object.entries(pageConfig.configValues).forEach(([configName, configValue]) => {
		const { value } = configValue;
		config[configName] = config[configName] ?? value;
		if (configValue.type === "standard") {
			const src = {
				type: "configsStandard",
				value: configValue.value,
				definedAt: getDefinedAtString(configValue.definedAtData, configName)
			};
			addSrc(src, configName);
			from.configsStandard[configName] = src;
			addLegacy(configName, value, configValue.definedAtData);
		}
		if (configValue.type === "cumulative") {
			const src = {
				type: "configsCumulative",
				definedAt: getDefinedAtString(configValue.definedAtData, configName),
				values: configValue.value.map((value, i) => {
					const definedAtFile = configValue.definedAtData[i];
					assert(definedAtFile);
					const definedAt = getDefinedAtString(definedAtFile, configName);
					addLegacy(configName, value, definedAtFile);
					return {
						value,
						definedAt
					};
				})
			};
			addSrc(src, configName);
			from.configsCumulative[configName] = src;
		}
		if (configValue.type === "computed") {
			const src = {
				type: "configsComputed",
				definedAt: "Vike",
				value: configValue.value
			};
			addSrc(src, configName);
			from.configsComputed[configName] = src;
			addLegacy(configName, value, configValue.definedAtData);
		}
	});
	return {
		config,
		configEntries,
		exportsAll,
		source,
		sources,
		from
	};
}
function getExportValues(pageFile) {
	const { filePath, fileExports } = pageFile;
	assert(fileExports);
	assert(isScriptFile(filePath));
	const exportValues = [];
	Object.entries(fileExports).sort(makeLast(([exportName]) => exportName === "default")).forEach(([exportName, exportValue]) => {
		let isFromDefaultExport = exportName === "default";
		if (isFromDefaultExport) if (isTemplateFile(filePath)) exportName = "Page";
		else {
			assertUsage(isObject(exportValue), `The ${picocolors_browser_default.cyan("export default")} of ${filePath} should be an object.`);
			Object.entries(exportValue).forEach(([defaultExportName, defaultExportValue]) => {
				assertDefaultExports(defaultExportName, filePath);
				exportValues.push({
					exportName: defaultExportName,
					exportValue: defaultExportValue,
					isFromDefaultExport
				});
			});
			return;
		}
		exportValues.push({
			exportName,
			exportValue,
			isFromDefaultExport
		});
	});
	exportValues.forEach(({ exportName, isFromDefaultExport }) => {
		assert(!(isFromDefaultExport && forbiddenDefaultExports.includes(exportName)));
	});
	return exportValues;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/createGlobalContextShared.js
async function createGlobalContextShared(virtualFileExportsGlobalEntry, globalObject, addGlobalContext, addGlobalContextTmp, addGlobalContextAsync) {
	const { previousCreateGlobalContextPromise } = globalObject;
	const { promise, resolve } = genPromise({ timeout: null });
	globalObject.previousCreateGlobalContextPromise = promise;
	if (previousCreateGlobalContextPromise) {
		assert(globalObject.globalContext);
		await previousCreateGlobalContextPromise;
	}
	try {
		const globalContext = createGlobalContextBase(virtualFileExportsGlobalEntry);
		let isNewGlobalContext;
		if (!globalObject.globalContext) {
			globalObject.globalContext = globalContext;
			isNewGlobalContext = false;
		} else isNewGlobalContext = true;
		if (addGlobalContext && globalContext._pageConfigs.length > 0) {
			const globalContextAdded = addGlobalContext?.(globalContext);
			objectAssign(globalContext, globalContextAdded);
		} else objectAssign(globalContext, await addGlobalContextTmp?.(globalContext));
		objectAssign(globalContext, await addGlobalContextAsync?.(globalContext));
		const onCreateGlobalContextHooks = getHooksFromPageConfigGlobalCumulative(globalContext._pageConfigGlobal, "onCreateGlobalContext");
		let hooksCalled = false;
		if (!hooksAreEqual(globalObject.onCreateGlobalContextHooks ?? [], onCreateGlobalContextHooks)) {
			globalObject.onCreateGlobalContextHooks = onCreateGlobalContextHooks;
			await execHookGlobal("onCreateGlobalContext", globalContext, getGlobalContextPublicShared);
			hooksCalled = true;
		}
		if (isNewGlobalContext) if (hooksCalled) objectReplace(globalObject.globalContext, globalContext);
		else objectAssign(globalObject.globalContext, globalContext, true);
		return globalObject.globalContext;
	} finally {
		resolve();
	}
}
function createGlobalContextBase(virtualFileExportsGlobalEntry) {
	const { pageFilesAll, pageConfigs, pageConfigGlobal } = parseVirtualFileExportsGlobalEntry(virtualFileExportsGlobalEntry);
	const globalContext = {
		isGlobalContext: true,
		_isOriginalObject: true,
		_virtualFileExportsGlobalEntry: virtualFileExportsGlobalEntry,
		_pageFilesAll: pageFilesAll,
		_pageConfigs: pageConfigs,
		_pageConfigGlobal: pageConfigGlobal,
		_allPageIds: getAllPageIds(pageFilesAll, pageConfigs),
		...resolveGlobalContextConfig(pageConfigs, pageConfigGlobal)
	};
	changeEnumerable(globalContext, "_isOriginalObject", false);
	return globalContext;
}
function getAllPageIds(pageFilesAll, pageConfigs) {
	const allPageIds = unique(pageFilesAll.filter(({ isDefaultPageFile }) => !isDefaultPageFile).map(({ pageId }) => pageId));
	const allPageIds2 = pageConfigs.map((p) => p.pageId);
	return [...allPageIds, ...allPageIds2];
}
function hooksAreEqual(hooks1, hooks2) {
	const hooksFn1 = hooks1.map((hook) => hook.hookFn);
	const hooksFn2 = hooks2.map((hook) => hook.hookFn);
	return hooksFn1.every((hook) => hooksFn2.includes(hook)) && hooksFn2.every((hook) => hooksFn1.includes(hook));
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/shared/getGlobalContextClientInternalShared.js
var globalObject$5 = getGlobalObject("getGlobalContextClientInternalShared.ts", (() => {
	const { promise: globalContextInitialPromise, resolve: globalContextInitialPromiseResolve } = genPromise();
	return {
		globalContextInitialPromise,
		globalContextInitialPromiseResolve
	};
})());
async function getGlobalContextClientInternalShared() {
	if (globalObject$5.globalContextPromise) return await globalObject$5.globalContextPromise;
	const globalContextPromise = createGlobalContextShared(globalObject$5.virtualFileExportsGlobalEntry, globalObject$5, () => {
		const globalContextAddendum = { isClientSide: true };
		objectAssign(globalContextAddendum, getGlobalContextSerializedInHtml());
		return globalContextAddendum;
	});
	globalObject$5.globalContextPromise = globalContextPromise;
	const globalContext = await globalContextPromise;
	assert(globalObject$5.globalContext === globalContext);
	globalObject$5.globalContextInitialPromiseResolve();
	return globalContext;
}
async function setVirtualFileExportsGlobalEntry(virtualFileExportsGlobalEntry) {
	if (globalObject$5.virtualFileExportsGlobalEntry !== virtualFileExportsGlobalEntry) {
		delete globalObject$5.globalContextPromise;
		globalObject$5.virtualFileExportsGlobalEntry = virtualFileExportsGlobalEntry;
		await getGlobalContextClientInternalShared();
	}
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/route/deduceRouteStringFromFilesystemPath.js
function deduceRouteStringFromFilesystemPath(pageId, filesystemRoots) {
	const fsBase = filesystemRoots.filter(({ filesystemRoot }) => pageId.startsWith(filesystemRoot)).sort(higherFirst(({ filesystemRoot }) => filesystemRoot.length))[0];
	let filesystemRoute;
	if (fsBase) {
		const { filesystemRoot, urlRoot } = fsBase;
		const debugInfo = {
			pageId,
			filesystemRoot,
			urlRoot
		};
		assert(urlRoot.startsWith("/") && pageId.startsWith("/") && filesystemRoot.startsWith("/"), debugInfo);
		assert(pageId.startsWith(filesystemRoot), debugInfo);
		if (filesystemRoot !== "/") {
			assert(!filesystemRoot.endsWith("/"), debugInfo);
			filesystemRoute = slice(pageId, filesystemRoot.length, 0);
		} else filesystemRoute = pageId;
		assert(filesystemRoute.startsWith("/"), debugInfo);
		filesystemRoute = urlRoot + (urlRoot.endsWith("/") ? "" : "/") + slice(filesystemRoute, 1, 0);
	} else filesystemRoute = pageId;
	assert(filesystemRoute.startsWith("/"));
	filesystemRoute = filesystemRoute.split("/").filter((dir) => dir !== "pages" && dir !== "src" && dir !== "index").join("/");
	assert(!filesystemRoute.includes(".page."));
	assert(!filesystemRoute.endsWith("."));
	if (filesystemRoute.endsWith("/index")) filesystemRoute = slice(filesystemRoute, 0, -6);
	if (filesystemRoute === "") filesystemRoute = "/";
	assert(filesystemRoute.startsWith("/"));
	assert(!filesystemRoute.endsWith("/") || filesystemRoute === "/");
	return filesystemRoute;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/isPromise.js
function isPromise(val) {
	return typeof val === "object" && val !== null && "then" in val && isCallable(val.then);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/route/resolveRouteFunction.js
async function resolveRouteFunction(routeFunction, pageContext, routeFunctionFilePath) {
	let { hookReturn: result } = execHookSingleSync({
		hookFn: routeFunction,
		hookFilePath: routeFunctionFilePath,
		hookName: "route"
	}, pageContext._globalContext, pageContext, getPageContextPublicShared);
	assertSyncRouting(result, `The Route Function ${routeFunctionFilePath}`);
	result = await result;
	if (result === false) return null;
	if (result === true) result = {};
	assertUsage(isPlainObject(result), `The Route Function ${routeFunctionFilePath} should return a boolean or a plain JavaScript object (but it's ${picocolors_browser_default.cyan(`typeof result === ${JSON.stringify(typeof result)}`)} instead)`);
	if ("match" in result) {
		const { match } = result;
		assertUsage(typeof match === "boolean", `The ${picocolors_browser_default.cyan("match")} value returned by the Route Function ${routeFunctionFilePath} should be a boolean.`);
		if (!match) return null;
	}
	let precedence = null;
	if ("precedence" in result) {
		precedence = result.precedence;
		assertUsage(typeof precedence === "number", `The ${picocolors_browser_default.cyan("precedence")} value returned by the Route Function ${routeFunctionFilePath} should be a number.`);
	}
	assertRouteParams(result, `The ${picocolors_browser_default.cyan("routeParams")} object returned by the Route Function ${routeFunctionFilePath} should`);
	const routeParams = result.routeParams || {};
	assertUsage(!("pageContext" in result), `Providing ${picocolors_browser_default.cyan("pageContext")} in Route Functions is prohibited, see https://vike.dev/route-function#cannot-provide-pagecontext`);
	assert(isPlainObject(routeParams));
	Object.keys(result).forEach((key) => {
		assertUsage(key === "match" || key === "routeParams" || key === "precedence", `The Route Function ${routeFunctionFilePath} returned an object with an unknown property ${picocolors_browser_default.cyan(key)} (the known properties are ${picocolors_browser_default.cyan("match")}, ${picocolors_browser_default.cyan("routeParams")}, and ${picocolors_browser_default.cyan("precedence")})`);
	});
	return {
		precedence,
		routeParams
	};
}
function assertSyncRouting(res, errPrefix) {
	assertWarning(!isPromise(res), `${errPrefix} returned a promise, but asynchronous routing is deprecated and will be removed in the next major release, see https://vike.dev/route-function#async`, { onlyOnce: true });
}
function warnDeprecatedAllowKey() {
	assertWarning(false, `${picocolors_browser_default.cyan("iKnowThePerformanceRisksOfAsyncRouteFunctions")} is deprecated and will be removed in the next major release`, { onlyOnce: true });
}
function assertRouteParams(result, errPrefix) {
	assert(errPrefix.endsWith(" should"));
	if (!hasProp(result, "routeParams")) return;
	assertUsage(hasProp(result, "routeParams", "string{}"), `${errPrefix} be ${picocolors_browser_default.bold("Record<string, string>")}`);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/route/loadPageRoutes.js
async function loadPageRoutes(pageFilesAll, pageConfigs, pageConfigGlobal, allPageIds) {
	await Promise.all(pageFilesAll.filter((p) => p.fileType === ".page.route").map((p) => p.loadFile?.()));
	return loadPageRoutesSync(pageFilesAll, pageConfigs, pageConfigGlobal, allPageIds);
}
function loadPageRoutesSync(pageFilesAll, pageConfigs, pageConfigGlobal, allPageIds) {
	const { onBeforeRouteHook, filesystemRoots } = getGlobalHooks(pageFilesAll, pageConfigs, pageConfigGlobal);
	return {
		pageRoutes: getPageRoutes(filesystemRoots, pageFilesAll, pageConfigs, allPageIds),
		onBeforeRouteHook
	};
}
function getPageRoutes(filesystemRoots, pageFilesAll, pageConfigs, allPageIds) {
	const pageRoutes = [];
	if (pageConfigs.length > 0) {
		assert(filesystemRoots === null);
		const comesFromV1PageConfig = true;
		pageConfigs.filter((p) => !p.isErrorPage).forEach((pageConfig) => {
			const pageId = pageConfig.pageId;
			let pageRoute = null;
			{
				const configName = "route";
				const configValue = getConfigValueRuntime(pageConfig, configName);
				if (configValue) {
					const route = configValue.value;
					assert(configValue.definedAtData);
					const definedAtString = getDefinedAtString(configValue.definedAtData, configName);
					if (typeof route === "string") pageRoute = {
						pageId,
						comesFromV1PageConfig,
						routeString: route,
						routeDefinedAtString: definedAtString,
						routeType: "STRING"
					};
					else {
						const { definedAtData } = configValue;
						assert(!isArray(definedAtData) && !definedAtData.definedBy);
						const { filePathToShowToUser } = definedAtData;
						assert(filePathToShowToUser);
						assert(isCallable(route));
						if (getConfigValueRuntime(pageConfig, "iKnowThePerformanceRisksOfAsyncRouteFunctions", "boolean")) warnDeprecatedAllowKey();
						pageRoute = {
							pageId,
							comesFromV1PageConfig,
							routeFunction: route,
							routeFunctionFilePath: filePathToShowToUser,
							routeDefinedAtString: definedAtString,
							routeType: "FUNCTION"
						};
					}
				}
			}
			if (!pageRoute) {
				const { routeFilesystem } = pageConfig;
				assert(routeFilesystem);
				const { routeString, definedAtLocation } = routeFilesystem;
				assert(routeFilesystem.routeString.startsWith("/"));
				pageRoute = {
					pageId,
					routeFilesystemDefinedBy: definedAtLocation,
					comesFromV1PageConfig,
					routeString,
					routeDefinedAtString: null,
					routeType: "FILESYSTEM"
				};
			}
			assert(pageRoute);
			pageRoutes.push(pageRoute);
		});
	}
	if (pageConfigs.length === 0) {
		assert(filesystemRoots);
		const comesFromV1PageConfig = false;
		allPageIds.filter((pageId) => !isErrorPageId(pageId, false)).forEach((pageId) => {
			const pageRouteFile = pageFilesAll.find((p) => p.pageId === pageId && p.fileType === ".page.route");
			if (!pageRouteFile || !("default" in pageRouteFile.fileExports)) {
				const routeString = deduceRouteStringFromFilesystemPath(pageId, filesystemRoots);
				assert(routeString.startsWith("/"));
				assert(!routeString.endsWith("/") || routeString === "/");
				pageRoutes.push({
					pageId,
					comesFromV1PageConfig,
					routeString,
					routeDefinedAtString: null,
					routeFilesystemDefinedBy: `${pageId}.page.*`,
					routeType: "FILESYSTEM"
				});
			} else {
				const { filePath, fileExports } = pageRouteFile;
				assert(fileExports.default);
				if (hasProp(fileExports, "default", "string")) {
					const routeString = fileExports.default;
					assertUsage(routeString.startsWith("/"), `A Route String should start with a leading slash '/' but ${filePath} has \`export default '${routeString}'\`. Make sure to \`export default '/${routeString}'\` instead.`);
					pageRoutes.push({
						pageId,
						comesFromV1PageConfig,
						routeString,
						routeDefinedAtString: filePath,
						routeType: "STRING"
					});
					return;
				}
				if (hasProp(fileExports, "default", "function")) {
					const routeFunction = fileExports.default;
					if ("iKnowThePerformanceRisksOfAsyncRouteFunctions" in fileExports) warnDeprecatedAllowKey();
					pageRoutes.push({
						pageId,
						comesFromV1PageConfig,
						routeFunction,
						routeFunctionFilePath: filePath,
						routeDefinedAtString: filePath,
						routeType: "FUNCTION"
					});
					return;
				}
				assertUsage(false, `The default export of ${filePath} should be a string or a function.`);
			}
		});
	}
	return pageRoutes;
}
function getGlobalHooks(pageFilesAll, pageConfigs, pageConfigGlobal) {
	if (pageConfigs.length > 0) return {
		onBeforeRouteHook: getHookFromPageConfigGlobal(pageConfigGlobal, "onBeforeRoute"),
		filesystemRoots: null
	};
	let onBeforeRouteHook = null;
	const filesystemRoots = [];
	pageFilesAll.filter((p) => p.fileType === ".page.route" && p.isDefaultPageFile).forEach(({ filePath, fileExports }) => {
		assert(fileExports);
		if ("onBeforeRoute" in fileExports) {
			assertUsage(hasProp(fileExports, "onBeforeRoute", "function"), `\`export { onBeforeRoute }\` of ${filePath} should be a function.`);
			const { onBeforeRoute } = fileExports;
			const hookName = "onBeforeRoute";
			onBeforeRouteHook = {
				hookFilePath: filePath,
				hookFn: onBeforeRoute,
				hookName,
				hookTimeout: getHookTimeoutDefault(hookName)
			};
		}
		if ("filesystemRoutingRoot" in fileExports) {
			assertUsage(hasProp(fileExports, "filesystemRoutingRoot", "string"), `\`export { filesystemRoutingRoot }\` of ${filePath} should be a string.`);
			assertUsage(hasProp(fileExports, "filesystemRoutingRoot", "string"), `\`export { filesystemRoutingRoot }\` of ${filePath} is \`'${fileExports.filesystemRoutingRoot}'\` but it should start with a leading slash \`/\`.`);
			filesystemRoots.push({
				filesystemRoot: dirname(filePath),
				urlRoot: fileExports.filesystemRoutingRoot
			});
		}
	});
	return {
		onBeforeRouteHook,
		filesystemRoots
	};
}
function dirname(filePath) {
	assert(filePath.startsWith("/"));
	assert(!filePath.endsWith("/"));
	const dirPath = slice(filePath.split("/"), 0, -1).join("/") || "/";
	assert(dirPath.startsWith("/"));
	assert(!dirPath.endsWith("/") || dirPath === "/");
	return dirPath;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/getGlobalContextClientInternal.js
async function getGlobalContextClientInternal() {
	const globalContext = await getGlobalContextClientInternalShared();
	objectAssign(globalContext, await addGlobalContext(globalContext));
	return globalContext;
}
async function addGlobalContext(globalContext) {
	const { pageRoutes, onBeforeRouteHook } = await loadPageRoutes(globalContext._pageFilesAll, globalContext._pageConfigs, globalContext._pageConfigGlobal, globalContext._allPageIds);
	return {
		_pageRoutes: pageRoutes,
		_onBeforeRouteHook: onBeforeRouteHook
	};
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/createPageContextClient.js
async function createPageContextClient(urlOriginal) {
	const pageContext = createPageContextBase(urlOriginal);
	const globalContext = await getGlobalContextClientInternal();
	objectAssign(pageContext, {
		_globalContext: globalContext,
		_pageFilesAll: globalContext._pageFilesAll
	});
	updateType(pageContext, createPageContextShared(pageContext, globalContext._globalConfigPublic));
	return pageContext;
}
function createPageContextBase(urlOriginal) {
	const pageContext = createPageContextObject();
	objectAssign(pageContext, {
		isClientSide: true,
		isPrerendering: false,
		urlOriginal,
		_urlHandler: null
	});
	const baseServer = getBaseServer();
	assert(isBaseServer$1(baseServer));
	objectAssign(pageContext, { _baseServer: baseServer });
	objectAssign(pageContext, getPageContextUrlComputed(pageContext));
	return pageContext;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/assertRoutingType.js
var state = getGlobalObject("utils/assertRouterType.ts", {});
function assertClientRouting() {
	assertNoContradiction(checkIfClientRouting());
	state.isClientRouting = true;
}
function checkIfClientRouting() {
	return state.isClientRouting !== false;
}
function assertNoContradiction(noContradiction) {
	assertUsage(isBrowser(), `${picocolors_browser_default.cyan("import { something } from 'vike/client/router'")} is forbidden on the server-side`, { showStackTrace: true });
	assertWarning(noContradiction, "You shouldn't `import { something } from 'vike/client/router'` when using Server Routing. The 'vike/client/router' utilities work only with Client Routing. In particular, don't `import { navigate }` nor `import { prefetch }` as they unnecessarily bloat your client-side bundle sizes.", {
		showStackTrace: true,
		onlyOnce: true
	});
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/page-configs/findPageConfig.js
function findPageConfig(pageConfigs, pageId) {
	const result = pageConfigs.filter((p) => p.pageId === pageId);
	assert(result.length <= 1);
	return result[0] ?? null;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/page-configs/loadAndParseVirtualFilePageEntry.js
async function loadAndParseVirtualFilePageEntry(pageConfig, isDev) {
	if ("isPageEntryLoaded" in pageConfig && !isDev) return pageConfig;
	const { moduleId, moduleExportsPromise } = pageConfig.loadVirtualFilePageEntry();
	const moduleExports = await moduleExportsPromise;
	assertVirtualFileExports(moduleExports, () => "configValuesSerialized" in moduleExports, moduleId);
	const virtualFileExportsPageEntry = moduleExports;
	let configValues;
	try {
		configValues = parseVirtualFileExportsPageEntry(virtualFileExportsPageEntry);
	} catch (e) {
		if (!(e instanceof ReferenceError) && !(e instanceof TypeError)) throw e;
		await new Promise((resolve) => setTimeout(resolve));
		configValues = parseVirtualFileExportsPageEntry(virtualFileExportsPageEntry);
	}
	Object.assign(pageConfig.configValues, configValues);
	objectAssign(pageConfig, { isPageEntryLoaded: true });
	return pageConfig;
}
function parseVirtualFileExportsPageEntry(virtualFileExportsPageEntry) {
	return parseConfigValuesSerialized(virtualFileExportsPageEntry.configValuesSerialized);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/shared/loadPageConfigsLazyClientSide.js
var errStamp = "_isAssetsError";
async function loadPageConfigsLazyClientSide(pageId, pageFilesAll, pageConfigs, pageConfigGlobal) {
	const pageFilesClientSide = getPageFilesClientSide(pageFilesAll, pageId);
	const pageConfig = findPageConfig(pageConfigs, pageId);
	let pageConfigLoaded;
	try {
		pageConfigLoaded = (await Promise.all([pageConfig && loadAndParseVirtualFilePageEntry(pageConfig, false), ...pageFilesClientSide.map((p) => p.loadFile?.())]))[0];
	} catch (err) {
		if (isFetchError(err)) Object.assign(err, { [errStamp]: true });
		throw err;
	}
	const pageContextAddendum = {};
	objectAssign(pageContextAddendum, resolvePageContextConfig(pageFilesClientSide, pageConfigLoaded, pageConfigGlobal));
	objectAssign(pageContextAddendum, { _pageFilesLoaded: pageFilesClientSide });
	return pageContextAddendum;
}
function isErrorFetchingStaticAssets(err) {
	if (!err) return false;
	return err[errStamp] === true;
}
function isFetchError(err) {
	if (!(err instanceof Error)) return false;
	return [
		"Failed to fetch dynamically imported module",
		"error loading dynamically imported module",
		"Importing a module script failed",
		"error resolving module specifier",
		"failed to resolve module"
	].some((s) => err.message.toLowerCase().includes(s.toLowerCase()));
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/shared/normalizeClientSideUrl.js
/** Resolves relative URLs */
function normalizeClientSideUrl(url, options) {
	assert(!url.startsWith("#"));
	const { searchOriginal, hashOriginal, pathname } = parseUrl(url, "/");
	let urlCurrent = `${pathname}${searchOriginal || ""}`;
	if (!options?.withoutHash) urlCurrent += hashOriginal || "";
	assert(urlCurrent.startsWith("/"));
	return urlCurrent;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/isLinkSkipped.js
function isLinkSkipped(linkTag) {
	const href = linkTag.getAttribute("href");
	return href === null || !isUrl(href) || href === "" || isUrlExternal(href) || isHrefSamePageHash(href) || isLinkExternal(linkTag) || isLinkIgnored(linkTag) || !hasBaseServer(href) || !isVikeLink(linkTag);
}
function isVikeLink(linkTag) {
	if (!isDisableAutomaticLinkInterception()) return true;
	else {
		const attrVal = linkTag.getAttribute("data-vike-link");
		return attrVal !== null && attrVal !== "false";
	}
}
function isLinkExternal(linkTag) {
	const target = linkTag.getAttribute("target");
	const rel = linkTag.getAttribute("rel");
	return target === "_blank" || target === "_external" || rel === "external" || linkTag.hasAttribute("download");
}
function isLinkIgnored(linkTag) {
	return linkTag.getAttribute("data-vike") === "false";
}
function isHrefSamePageHash(href) {
	if (href.startsWith("#")) return true;
	if (href.includes("#") && normalizeClientSideUrl(href, { withoutHash: true }) === normalizeClientSideUrl(window.location.href, { withoutHash: true })) return true;
	return false;
}
function isHrefCurrentUrl(href) {
	if (href.startsWith("#")) return href === window.location.hash;
	return normalizeClientSideUrl(href) === normalizeClientSideUrl(window.location.href);
}
function hasBaseServer(href) {
	const baseServer = getBaseServer();
	assert(isBaseServer$1(baseServer));
	const { isBaseMissing } = parseUrl(href, baseServer);
	return !isBaseMissing;
}
function isDisableAutomaticLinkInterception() {
	return !!window._disableAutomaticLinkInterception;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/getPageFiles/analyzePageClientSide/getExportNames.js
function getExportNames(p) {
	if (p.fileType === ".css") return [];
	if (p.exportNames) return p.exportNames;
	assert(p.fileExports, p.filePath);
	return Object.keys(p.fileExports);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/getPageFiles/analyzePageClientSide/analyzeExports.js
function analyzeExports({ pageFilesClientSide, pageFilesServerSide, pageId }) {
	return {
		isHtmlOnly: isHtmlOnly(),
		isClientRouting: isClientRouting()
	};
	function isHtmlOnly() {
		if (pageFilesServerSide.some((p) => p.pageId === pageId && p.fileType === ".page")) {
			assertClientSideRenderHook();
			return false;
		}
		if (!pageFilesServerSide.some((p) => p.pageId === pageId && p.fileType === ".page.server")) return false;
		if (pageFilesClientSide.some((p) => p.pageId === pageId && p.fileType === ".page.client" && getExportNames(p).includes("render"))) return false;
		return true;
	}
	function assertClientSideRenderHook() {
		assertUsage(pageFilesClientSide.some((p) => {
			return getExportNames(p).includes("render");
		}), [
			"No client-side `render()` hook found.",
			"See https://vike.dev/render-modes for more information.",
			["Loaded client-side page files (none of them `export { render }`):", ...pageFilesClientSide.map((p, i) => ` (${i + 1}): ${p.filePath}`)].join("\n")
		].join(" "));
	}
	function isClientRouting() {
		return pageFilesClientSide.some((p) => {
			return getExportNames(p).includes("clientRouting");
		});
	}
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/getPageFiles/analyzePageClientSide/determineClientEntry.js
function determineClientEntry({ pageFilesClientSide, pageFilesServerSide, isHtmlOnly, isClientRouting }) {
	let clientEntries = [];
	const pageFilesServerSideOnly = pageFilesServerSide.filter((p) => !pageFilesClientSide.includes(p));
	const clientDependencies = [];
	clientDependencies.push(...pageFilesClientSide.map((p) => ({
		id: p.filePath,
		onlyAssets: false,
		eagerlyImported: false
	})));
	clientDependencies.push(...pageFilesServerSideOnly.map((p) => ({
		id: p.filePath,
		onlyAssets: true,
		eagerlyImported: false
	})));
	if (isHtmlOnly) clientEntries = pageFilesClientSide.map((p) => p.filePath);
	else {
		const clientEntry = getVikeClientEntry(isClientRouting);
		clientDependencies.push({
			id: clientEntry,
			onlyAssets: false,
			eagerlyImported: false
		});
		clientEntries = [clientEntry];
	}
	return {
		clientEntries,
		clientDependencies
	};
}
function getVikeClientEntry(isClientRouting) {
	return isClientRouting ? "@@vike/dist/client/runtime-client-routing/entry.js" : "@@vike/dist/client/runtime-server-routing/entry.js";
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/getPageFiles/analyzePageClientSide.js
function analyzePageClientSide(pageFilesAll, pageId) {
	let pageFilesClientSide = getPageFilesClientSide(pageFilesAll, pageId);
	const pageFilesServerSide = getPageFilesServerSide(pageFilesAll, pageId);
	const { isHtmlOnly, isClientRouting } = analyzeExports({
		pageFilesClientSide,
		pageFilesServerSide,
		pageId
	});
	if (isHtmlOnly) {
		pageFilesClientSide = pageFilesClientSide.filter((p) => p.isEnv("CLIENT_ONLY") && !getExportNames(p).includes("render"));
		pageFilesClientSide = removeOverriddenPageFiles(pageFilesClientSide);
	}
	const { clientEntries, clientDependencies } = determineClientEntry({
		pageFilesClientSide,
		pageFilesServerSide,
		isHtmlOnly,
		isClientRouting
	});
	return {
		isHtmlOnly,
		isClientRouting,
		clientEntries,
		clientDependencies,
		pageFilesClientSide,
		pageFilesServerSide
	};
}
async function analyzePageClientSideInit(pageFilesAll, pageId, { sharedPageFilesAlreadyLoaded }) {
	const pageFilesClientSide = getPageFilesClientSide(pageFilesAll, pageId);
	await Promise.all(pageFilesClientSide.map(async (p) => {
		assert(p.isEnv("CLIENT_ONLY") || p.isEnv("CLIENT_AND_SERVER"));
		if (sharedPageFilesAlreadyLoaded && p.isEnv("CLIENT_AND_SERVER")) return;
		await p.loadExportNames?.();
	}));
}
function removeOverriddenPageFiles(pageFilesClientSide) {
	const pageFilesClientSide_ = [];
	for (const p of pageFilesClientSide) {
		pageFilesClientSide_.push(p);
		if (getExportNames(p).includes("overrideDefaultPages")) break;
	}
	return pageFilesClientSide_;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/getPageFiles/analyzeClientSide.js
function analyzeClientSide(pageConfig, pageFilesAll, pageId) {
	if (pageConfig) {
		const isClientRouting = getConfigValueRuntime(pageConfig, "clientRouting", "boolean")?.value ?? false;
		return {
			isClientRuntimeLoaded: getConfigValueRuntime(pageConfig, "isClientRuntimeLoaded", "boolean")?.value ?? false,
			isClientRouting
		};
	} else {
		const { isHtmlOnly, isClientRouting } = analyzePageClientSide(pageFilesAll, pageId);
		return {
			isClientRuntimeLoaded: !isHtmlOnly,
			isClientRouting
		};
	}
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/isClientSideRoutable.js
async function isClientSideRoutable(pageId, pageContext) {
	await analyzePageClientSideInit(pageContext._pageFilesAll, pageId, { sharedPageFilesAlreadyLoaded: false });
	const { isClientRuntimeLoaded, isClientRouting } = analyzeClientSide(findPageConfig(pageContext._globalContext._pageConfigs, pageId), pageContext._pageFilesAll, pageId);
	return isClientRuntimeLoaded && isClientRouting;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/escapeRegex.js
function escapeRegex(str) {
	return str.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/route/resolveRouteString.js
var PARAM_TOKEN_NEW = "@";
var PARAM_TOKEN_OLD = ":";
function assertRouteString(routeString, errPrefix = "Invalid") {
	let errPrefix2 = `${errPrefix} Route String ${highlight(routeString)}`;
	assertUsage(routeString !== "", `${errPrefix2} (empty string): set it to ${highlight("/")} instead`);
	assertUsage(["/", "*"].includes(routeString[0]), `${errPrefix2}: it should start with ${highlight("/")} or ${highlight("*")}`);
	assertUsage(!routeString.includes("**"), `${errPrefix2}: set it to ${highlight(routeString.split("**").join("*"))} instead`);
}
function resolveRouteString(routeString, urlPathname) {
	assertRouteString(routeString);
	const segments = parseRouteString(routeString);
	const routeRegexStrInner = segments.map((segment) => {
		if (segment.param) return "[^/]+";
		if (segment.glob) return ".*";
		return escapeRegex(segment.static);
	}).map((s) => `(${s})`).join("");
	const routeRegex = new RegExp(`^${routeRegexStrInner}/?$`);
	const routeRegexMatch = urlPathname.match(routeRegex);
	if (!routeRegexMatch) return null;
	const routeParams = {};
	const [_, ...segmentsValue] = routeRegexMatch;
	let globIdx = 0;
	const hasMultipleGlobs = segments.filter((segment) => segment.glob).length > 1;
	segments.forEach((segment, i) => {
		let val = segmentsValue[i];
		if (segment.param) routeParams[segment.param] = val;
		if (segment.glob) {
			const param = `*${hasMultipleGlobs ? ++globIdx : ""}`;
			routeParams[param] = val;
		}
	});
	return { routeParams };
}
function parseRouteString(routeString) {
	const segments = [];
	const pushStatic = (s) => {
		const segmentLast = segments[segments.length - 1];
		if (segmentLast?.static) segmentLast.static += s;
		else segments.push({ static: s });
	};
	const parts = routeString.split("/");
	parts.forEach((s, i) => {
		if (i !== 0) pushStatic("/");
		if (isParam(s)) {
			assertWarning(!s.startsWith(PARAM_TOKEN_OLD), `Outdated Route String ${highlight(routeString)}, use ${highlight(routeString.split(PARAM_TOKEN_OLD).join(PARAM_TOKEN_NEW))} instead`, { onlyOnce: true });
			segments.push({ param: s.slice(1) });
		} else if (s === "*" && i === parts.length - 1 && routeString !== "*" && routeString !== "/*") segments.push({ glob: true });
		else s.split("*").forEach((s, i) => {
			if (i !== 0) segments.push({ glob: true });
			if (s !== "") pushStatic(s);
		});
	});
	return segments;
}
function getRouteStringParameterList(routeString) {
	const routeParameterList = [];
	parseRouteString(routeString).forEach((segment) => {
		if (segment.param) routeParameterList.push(segment.param);
	});
	return routeParameterList;
}
function analyzeRouteString(routeString) {
	const segments = parseRouteString(routeString);
	const countStaticParts = (s) => s?.split("/").filter(Boolean).length || 0;
	let numberOfStaticPartsBeginning = 0;
	for (const segment of segments) {
		if (!segment.static) break;
		numberOfStaticPartsBeginning += countStaticParts(segment.static);
	}
	const numberOfStaticParts = segments.map((s) => countStaticParts(s.static)).reduce((sum, a) => sum + a, 0);
	const numberOfParams = segments.filter((s) => s.param).length;
	const numberOfGlobs = segments.filter((s) => s.glob).length;
	return {
		numberOfStaticPartsBeginning,
		numberOfStaticParts,
		numberOfParams,
		numberOfGlobs
	};
}
function isParam(routeSegment) {
	return routeSegment.startsWith(PARAM_TOKEN_NEW) || routeSegment.startsWith(PARAM_TOKEN_OLD);
}
function isStaticRouteString(routeString) {
	const match = resolveRouteString(routeString, routeString);
	assert(match);
	return Object.keys(match.routeParams).length === 0;
}
function highlight(routeString) {
	if (isBrowser()) return `'${routeString}'`;
	else {
		if (routeString === "") routeString = "''";
		return picocolors_browser_default.cyan(routeString);
	}
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/route/resolvePrecedence.js
function resolvePrecedence(routeMatches) {
	routeMatches.sort(sortMatches).sort(makeFirst((routeMatch) => routeMatch.routeType === "FUNCTION" && !!routeMatch.precedence && routeMatch.precedence < 0)).sort(makeFirst((routeMatch) => routeMatch.routeType === "STRING" && isStaticRouteString(routeMatch.routeString) === false)).sort(makeFirst((routeMatch) => routeMatch.routeType === "FUNCTION" && !routeMatch.precedence)).sort(makeFirst((routeMatch) => routeMatch.routeType === "STRING" && isStaticRouteString(routeMatch.routeString) === true)).sort(makeFirst((routeMatch) => routeMatch.routeType === "FILESYSTEM")).sort(makeFirst((routeMatch) => routeMatch.routeType === "FUNCTION" && !!routeMatch.precedence && routeMatch.precedence > 0));
}
function sortMatches(routeMatch1, routeMatch2) {
	{
		const precedence1 = routeMatch1.precedence ?? 0;
		const precedence2 = routeMatch2.precedence ?? 0;
		if (precedence1 !== precedence2) return precedence1 > precedence2 ? -1 : 1;
	}
	if (!routeMatch2.routeString) return 0;
	if (!routeMatch1.routeString) return 0;
	{
		const getValue = (routeString) => analyzeRouteString(routeString).numberOfStaticPartsBeginning;
		const result = higherFirst(getValue)(routeMatch1.routeString, routeMatch2.routeString);
		if (result !== 0) return result;
	}
	{
		const getValue = (routeString) => analyzeRouteString(routeString).numberOfStaticParts;
		const result = higherFirst(getValue)(routeMatch1.routeString, routeMatch2.routeString);
		if (result !== 0) return result;
	}
	{
		const getValue = (routeString) => analyzeRouteString(routeString).numberOfGlobs;
		const result = lowerFirst(getValue)(routeMatch1.routeString, routeMatch2.routeString);
		if (result !== 0) return result;
	}
	{
		const getValue = (routeString) => analyzeRouteString(routeString).numberOfParams;
		const result = higherFirst(getValue)(routeMatch1.routeString, routeMatch2.routeString);
		if (result !== 0) return result;
	}
	return 0;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/isObjectWithKeys.js
function isObjectWithKeys(obj, keys) {
	if (!isPlainObject(obj)) return false;
	for (const key of Object.keys(obj)) if (!keys.includes(key)) return false;
	return true;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/route/execHookOnBeforeRoute.js
async function execHookOnBeforeRoute(pageContext) {
	const pageContextFromOnBeforeRouteHook = {};
	if (!pageContext._globalContext._onBeforeRouteHook) return null;
	const pageContextFromHook = await getPageContextFromHook(pageContext._globalContext._onBeforeRouteHook, pageContext);
	if (pageContextFromHook) {
		objectAssign(pageContextFromOnBeforeRouteHook, pageContextFromHook);
		if (hasProp(pageContextFromOnBeforeRouteHook, "pageId", "string") || hasProp(pageContextFromOnBeforeRouteHook, "pageId", "null")) {
			if (!hasProp(pageContextFromOnBeforeRouteHook, "routeParams")) objectAssign(pageContextFromOnBeforeRouteHook, { routeParams: {} });
			else assert(hasProp(pageContextFromOnBeforeRouteHook, "routeParams", "object"));
			objectAssign(pageContextFromOnBeforeRouteHook, { _routingProvidedByOnBeforeRouteHook: true });
			return pageContextFromOnBeforeRouteHook;
		}
	}
	objectAssign(pageContextFromOnBeforeRouteHook, { _routingProvidedByOnBeforeRouteHook: false });
	return pageContextFromOnBeforeRouteHook;
}
async function getPageContextFromHook(onBeforeRouteHook, pageContext) {
	let { hookReturn } = execHookSingleSync(onBeforeRouteHook, pageContext._globalContext, pageContext, getPageContextPublicShared);
	assertSyncRouting(hookReturn, `The onBeforeRoute() hook ${onBeforeRouteHook.hookFilePath}`);
	hookReturn = await hookReturn;
	const errPrefix = `The onBeforeRoute() hook defined by ${onBeforeRouteHook.hookFilePath}`;
	assertUsage(hookReturn === null || hookReturn === void 0 || isObjectWithKeys(hookReturn, ["pageContext"]) && hasProp(hookReturn, "pageContext"), `${errPrefix} should return ${picocolors_browser_default.cyan("null")}, ${picocolors_browser_default.cyan("undefined")}, or a plain JavaScript object ${picocolors_browser_default.cyan("{ pageContext: { /* ... */ } }")}`);
	if (hookReturn === null || hookReturn === void 0) return null;
	assertUsage(hasProp(hookReturn, "pageContext", "object"), `${errPrefix} returned ${picocolors_browser_default.cyan("{ pageContext }")} but pageContext should be a plain JavaScript object.`);
	if (hasProp(hookReturn.pageContext, "pageId") && !hasProp(hookReturn.pageContext, "pageId", "null")) {
		const errPrefix2 = `${errPrefix} returned ${picocolors_browser_default.cyan("{ pageContext: { pageId } }")} but ${picocolors_browser_default.cyan("pageId")} should be`;
		assertUsage(hasProp(hookReturn.pageContext, "pageId", "string"), `${errPrefix2} a string or null`);
		assertUsage(pageContext._globalContext._allPageIds.includes(hookReturn.pageContext.pageId), `${errPrefix2} ${joinEnglish(pageContext._globalContext._allPageIds.map((s) => picocolors_browser_default.cyan(s)), "or")}`);
	}
	if (hasProp(hookReturn.pageContext, "routeParams")) assertRouteParams(hookReturn.pageContext, `${errPrefix} returned ${picocolors_browser_default.cyan("{ pageContext: { routeParams } }")} but routeParams should`);
	const deprecatedReturn = (prop) => `${errPrefix} returned ${picocolors_browser_default.cyan(`{ pageContext: { ${prop} } }`)} which is deprecated. Return ${picocolors_browser_default.cyan("{ pageContext: { urlLogical } }")} instead.`;
	if (hasProp(hookReturn.pageContext, "url")) {
		assertWarning(false, deprecatedReturn("url"), { onlyOnce: true });
		hookReturn.pageContext.urlLogical = hookReturn.pageContext.url;
		delete hookReturn.pageContext.url;
	}
	if (hasProp(hookReturn.pageContext, "urlOriginal")) {
		assertWarning(false, deprecatedReturn("urlOriginal"), { onlyOnce: true });
		hookReturn.pageContext.urlLogical = hookReturn.pageContext.urlOriginal;
		delete hookReturn.pageContext.urlOriginal;
	}
	if (hasProp(hookReturn.pageContext, "urlLogical")) assertUsageUrlAbsolute(hookReturn.pageContext.urlLogical, `${errPrefix} returned ${picocolors_browser_default.cyan("{ pageContext: { urlLogical } }")} and ${picocolors_browser_default.cyan("urlLogical")}`);
	assertPageContextProvidedByUser(hookReturn.pageContext, {
		hookFilePath: onBeforeRouteHook.hookFilePath,
		hookName: "onBeforeRoute"
	});
	const pageContextAddendumHook = {};
	objectAssign(pageContextAddendumHook, hookReturn.pageContext);
	return pageContextAddendumHook;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/shared-server-client/route/index.js
if (isBrowser()) assertClientRouting();
async function route(pageContext, skipOnBeforeRouteHook) {
	const pageContextFromRoute = {};
	if (!skipOnBeforeRouteHook) {
		const pageContextFromOnBeforeRouteHook = await execHookOnBeforeRoute(pageContext);
		if (pageContextFromOnBeforeRouteHook) if (pageContextFromOnBeforeRouteHook._routingProvidedByOnBeforeRouteHook) {
			assert(pageContextFromOnBeforeRouteHook.pageId);
			return pageContextFromOnBeforeRouteHook;
		} else objectAssign(pageContextFromRoute, pageContextFromOnBeforeRouteHook);
		objectAssign(pageContext, pageContextFromOnBeforeRouteHook);
	}
	const allPageIds = pageContext._globalContext._allPageIds;
	assertUsage(allPageIds.length > 0, "No page found. You must create at least one page.");
	assert(pageContext._globalContext._pageFilesAll.length > 0 || pageContext._globalContext._pageConfigs.length > 0);
	const { urlPathname } = pageContext;
	assert(urlPathname.startsWith("/"));
	const routeMatches = [];
	await Promise.all(pageContext._globalContext._pageRoutes.map(async (pageRoute) => {
		const { pageId, routeType } = pageRoute;
		if (pageRoute.routeType === "FILESYSTEM") {
			const { routeString } = pageRoute;
			const match = resolveRouteString(routeString, urlPathname);
			if (match) {
				const { routeParams } = match;
				routeMatches.push({
					pageId,
					routeParams,
					routeString,
					routeType
				});
			}
			return;
		}
		if (pageRoute.routeType === "STRING") {
			const { routeString } = pageRoute;
			const match = resolveRouteString(routeString, urlPathname);
			if (match) {
				const { routeParams } = match;
				assert(routeType === "STRING");
				routeMatches.push({
					pageId,
					routeString,
					routeParams,
					routeType
				});
			}
			return;
		}
		if (pageRoute.routeType === "FUNCTION") {
			const { routeFunction, routeFunctionFilePath } = pageRoute;
			const match = await resolveRouteFunction(routeFunction, pageContext, routeFunctionFilePath);
			if (match) {
				const { routeParams, precedence } = match;
				routeMatches.push({
					pageId,
					precedence,
					routeParams,
					routeType
				});
			}
			return;
		}
		assert(false);
	}));
	resolvePrecedence(routeMatches);
	const winner = routeMatches[0] ?? null;
	objectAssign(pageContextFromRoute, { _routeMatch: winner });
	if (!winner) {
		objectAssign(pageContextFromRoute, {
			pageId: null,
			routeParams: {}
		});
		return pageContextFromRoute;
	}
	{
		const { routeParams } = winner;
		assert(isPlainObject(routeParams));
		objectAssign(pageContextFromRoute, {
			pageId: winner.pageId,
			routeParams: winner.routeParams
		});
	}
	return pageContextFromRoute;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/getPageContextCurrent.js
var globalObject$4 = getGlobalObject("getPageContextCurrent.ts", { pageContextCurrent: null });
function getPageContextCurrent() {
	const { pageContextCurrent } = globalObject$4;
	return pageContextCurrent;
}
function setPageContextCurrent(pageContextCurrent) {
	globalObject$4.pageContextCurrent = pageContextCurrent;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/prefetch/getPrefetchSettings.js
var PAGE_CONTEXT_MAX_AGE_DEFAULT = 5e3;
var prefetchSettingTrue = {
	staticAssets: "hover",
	pageContext: PAGE_CONTEXT_MAX_AGE_DEFAULT
};
var prefetchSettingFalse = {
	staticAssets: "hover",
	pageContext: false
};
var prefetchSettingDefault = prefetchSettingFalse;
function getPrefetchSettings(pageContext, linkTag) {
	let prefetchSetting = prefetchSettingDefault;
	if ("prefetchLinks" in pageContext.exports) assertUsage(false, "`export { prefetchLinks }` is deprecated, use `export { prefetchStaticAssets }` instead.");
	if ("prefetchStaticAssets" in pageContext.exports) {
		const prefetchStaticAssets = pageContext.exports.prefetchStaticAssets;
		prefetchSetting.staticAssets = prefetchStaticAssets;
	}
	if ("prefetch" in pageContext.exports) {
		const { prefetch } = pageContext.exports;
		if (prefetch === true) prefetchSetting = prefetchSettingTrue;
		if (prefetch === false) prefetchSetting = prefetchSettingFalse;
		Object.assign(prefetchSetting, prefetch);
		if (prefetchSetting.pageContext === true) prefetchSetting.pageContext = PAGE_CONTEXT_MAX_AGE_DEFAULT;
	}
	if (prefetchSetting.staticAssets === "viewport" && false);
	if (linkTag) {
		{
			let attr = linkTag.getAttribute("data-prefetch");
			if (attr !== null) {
				if (attr === "") attr = "true";
				if (attr === "true") prefetchSetting = prefetchSettingTrue;
				if (attr === "false") prefetchSetting = prefetchSettingFalse;
			}
		}
		{
			let attr = linkTag.getAttribute("data-prefetch-static-assets");
			if (attr !== null) {
				if (attr === "false") prefetchSetting.staticAssets = false;
				prefetchSetting.staticAssets = attr;
			}
		}
		{
			let attr = linkTag.getAttribute("data-prefetch-page-context");
			if (attr !== null) {
				if (attr === "") attr = "true";
				if (attr === "true") prefetchSetting.pageContext = PAGE_CONTEXT_MAX_AGE_DEFAULT;
				if (attr === "false") prefetchSetting.pageContext = false;
				const n = parseInt(attr, 10);
				if (!Number.isNaN(n)) prefetchSetting.pageContext = n;
			}
		}
	}
	return prefetchSetting;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/normalizeUrlArgument.js
function normalizeUrlArgument(url, fnName) {
	const errMsg = `URL ${url} passed to ${fnName}() is invalid`;
	assertUsage(isUrl(url), errMsg);
	if (url.startsWith(location.origin)) url = url.slice(location.origin.length);
	assertUsage(url.startsWith("/") || isUrlRelative(url), errMsg);
	return url;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/prefetch.js
assertClientRouting();
var globalObject$3 = getGlobalObject("prefetch.ts", {
	linkPrefetchHandlerAdded: /* @__PURE__ */ new WeakSet(),
	addLinkPrefetchHandlers_debounce: null,
	mutationObserver: new MutationObserver(addLinkPrefetchHandlers),
	linkTags: document.getElementsByTagName("A"),
	prefetchedPageContexts: {}
});
function getPageContextPrefetched(pageContext) {
	if (!getPrefetchSettings(pageContext, null).pageContext) return null;
	const key = getCacheKey(pageContext.urlPathname);
	const found = globalObject$3.prefetchedPageContexts[key];
	if (!found || found.result.is404ServerSideRouted || isExpired(found)) return null;
	return found.result.pageContextFromHooksServer;
}
async function prefetchAssets(pageContextLink) {
	try {
		await loadPageConfigsLazyClientSide(pageContextLink.pageId, pageContextLink._pageFilesAll, pageContextLink._globalContext._pageConfigs, pageContextLink._globalContext._pageConfigGlobal);
	} catch (err) {
		if (isErrorFetchingStaticAssets(err)) disableClientRouting(err, true);
		else throw err;
	}
}
async function prefetchPageContextFromHooksServer(pageContextLink, resultMaxAge) {
	setPageContextPrefetchCache(pageContextLink, await getPageContextFromHooksServer(pageContextLink, false), resultMaxAge);
}
function populatePageContextPrefetchCache(pageContext, result) {
	if (!isBrilloutDocpress()) return;
	setPageContextPrefetchCache(pageContext, result, null);
}
function setPageContextPrefetchCache(pageContext, result, resultMaxAge) {
	if (resultMaxAge === null) resultMaxAge = getResultMaxAge();
	const key = getCacheKey(pageContext.urlPathname);
	assert(isBrilloutDocpress());
	globalObject$3.prefetchedPageContexts[key] = {
		resultFetchedAt: Date.now(),
		resultMaxAge,
		result
	};
}
function getResultMaxAge() {
	const pageContextCurrent = getPageContextCurrent();
	if (!pageContextCurrent) return Infinity;
	const prefetchSettings = getPrefetchSettings(pageContextCurrent, null);
	return typeof prefetchSettings.pageContext === "number" ? prefetchSettings.pageContext : PAGE_CONTEXT_MAX_AGE_DEFAULT;
}
function addLinkPrefetchHandlers() {
	if (globalObject$3.addLinkPrefetchHandlers_debounce) clearTimeout(globalObject$3.addLinkPrefetchHandlers_debounce);
	globalObject$3.addLinkPrefetchHandlers_debounce = setTimeout(() => {
		if ("requestIdleCallback" in window) requestIdleCallback(addLinkPrefetchHandlers_apply, { timeout: 300 });
		else setTimeout(addLinkPrefetchHandlers_apply, 150);
	}, 250);
}
function initLinkPrefetchHandlers() {
	addLinkPrefetchHandlers();
}
function addLinkPrefetchHandlers_watch() {
	globalObject$3.mutationObserver.observe(document.body, {
		childList: true,
		subtree: true
	});
}
function addLinkPrefetchHandlers_unwatch() {
	globalObject$3.mutationObserver.disconnect();
}
function addLinkPrefetchHandlers_apply() {
	for (let linkTag of globalObject$3.linkTags) {
		if (globalObject$3.linkPrefetchHandlerAdded.has(linkTag)) continue;
		globalObject$3.linkPrefetchHandlerAdded.add(linkTag);
		if (isLinkSkipped(linkTag)) continue;
		linkTag.addEventListener("mouseover", () => {
			prefetchOnEvent(linkTag, "hover");
		}, { passive: true });
		linkTag.addEventListener("touchstart", () => {
			prefetchOnEvent(linkTag, "hover");
		}, { passive: true });
		new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) prefetchOnEvent(linkTag, "viewport");
			});
		}).observe(linkTag);
	}
}
async function prefetchOnEvent(linkTag, event) {
	let prefetchSettings;
	const pageContextCurrent = getPageContextCurrent();
	if (pageContextCurrent) prefetchSettings = getPrefetchSettings(pageContextCurrent, linkTag);
	else if (isBrilloutDocpress()) prefetchSettings = {
		staticAssets: "hover",
		pageContext: Infinity
	};
	else return;
	if (isLinkSkipped(linkTag)) return;
	const urlOfLink = linkTag.getAttribute("href");
	const pageContextLink = await getPageContextLink(urlOfLink);
	if (!pageContextLink?.pageId) return;
	assert(hasProp(pageContextLink, "pageId", "string"));
	if (!await isClientSideRoutable(pageContextLink.pageId, pageContextLink)) return;
	await Promise.all([(async () => {
		if (prefetchSettings.staticAssets === event) await prefetchAssets(pageContextLink);
	})(), (async () => {
		if (event !== "viewport" && prefetchSettings.pageContext) {
			const key = getCacheKey(urlOfLink);
			const found = globalObject$3.prefetchedPageContexts[key];
			if (!found || isExpired(found)) {
				const resultMaxAge = prefetchSettings.pageContext;
				await prefetchPageContextFromHooksServer(pageContextLink, resultMaxAge);
			}
		}
	})()]);
}
function isExpired(found) {
	return Date.now() - found.resultFetchedAt > found.resultMaxAge;
}
async function getPageContextLink(urlOfLink) {
	const pageContextLink = await createPageContextClient(urlOfLink);
	let pageContextFromRoute;
	try {
		pageContextFromRoute = await route(pageContextLink);
	} catch {
		return null;
	}
	objectAssign(pageContextLink, pageContextFromRoute);
	return pageContextLink;
}
function getCacheKey(url) {
	if (url.startsWith("#")) url = "/";
	assert(url.startsWith("/"), { urlPathname: url });
	return url.split("#")[0];
}
function isBrilloutDocpress() {
	return "_isBrilloutDocpress" in window;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/shared/execHookOnRenderClient.js
async function execHookOnRenderClient(pageContext, getPageContextPublic) {
	let hook = null;
	hook = getHookFromPageContext(pageContext, "render");
	{
		const renderHook = getHookFromPageContext(pageContext, "onRenderClient");
		if (renderHook) hook = renderHook;
	}
	if (!hook) {
		const urlToShowToUser = getUrlToShowToUser(pageContext);
		assert(urlToShowToUser);
		if (pageContext._globalContext._pageConfigs.length > 0) assertUsage(false, `No onRenderClient() hook defined for URL '${urlToShowToUser}', but it's needed, see https://vike.dev/onRenderClient`);
		else {
			const pageClientsFilesLoaded = pageContext._pageFilesLoaded.filter((p) => p.fileType === ".page.client");
			let errMsg;
			if (pageClientsFilesLoaded.length === 0) errMsg = "No file `*.page.client.*` found for URL " + urlToShowToUser;
			else errMsg = "One of the following files should export a render() hook: " + pageClientsFilesLoaded.map((p) => p.filePath).join(" ");
			assertUsage(false, errMsg);
		}
	}
	await execHookSingle(hook, pageContext, getPageContextPublic);
}
function getUrlToShowToUser(pageContext) {
	let url;
	try {
		url = pageContext.urlPathname ?? pageContext.urlOriginal;
	} catch {}
	url = url ?? window.location.href;
	return url;
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/shared/getCurrentUrl.js
function getCurrentUrl(options) {
	return normalizeClientSideUrl(window.location.href, options);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/history.js
var globalObject$2 = getGlobalObject("history.ts", {
	monkeyPatched: false,
	previous: void 0
});
initHistory();
globalObject$2.previous = getHistoryInfo();
function enhance() {
	if (isEnhanced(window.history.state)) return;
	replaceHistoryState({ vike: {
		timestamp: getTimestamp(),
		scrollPosition: getScrollPosition(),
		triggeredBy: "browser"
	} });
}
function getState() {
	const state = window.history.state;
	assertIsEnhanced(state);
	return state;
}
function getScrollPosition() {
	return {
		x: window.scrollX,
		y: window.scrollY
	};
}
function getTimestamp() {
	return (/* @__PURE__ */ new Date()).getTime();
}
function saveScrollPosition(scrollPosition) {
	scrollPosition || (scrollPosition = getScrollPosition());
	if (!isEnhanced(window.history.state)) return;
	const state = getState();
	replaceHistoryState({
		...state,
		vike: {
			...state.vike,
			scrollPosition
		}
	});
}
function pushHistoryState(url, overwriteLastHistoryEntry) {
	if (!overwriteLastHistoryEntry) {
		const state = { vike: {
			timestamp: getTimestamp(),
			scrollPosition: null,
			triggeredBy: "vike"
		} };
		window.history.pushState(state, "", url);
	} else replaceHistoryState(getState(), url);
}
function replaceHistoryState(state, url) {
	const url_ = url ?? null;
	window.history.replaceState(state, "", url_);
	assertIsEnhanced(window.history.state);
}
function replaceHistoryStateOriginal(state, url) {
	History.prototype.replaceState.bind(window.history)(state, "", url);
}
function monkeyPatchHistoryAPI() {
	if (globalObject$2.monkeyPatched) return;
	globalObject$2.monkeyPatched = true;
	["pushState", "replaceState"].forEach((funcName) => {
		const funcOriginal = window.history[funcName].bind(window.history);
		window.history[funcName] = (stateFromUser = {}, ...rest) => {
			assertUsage(stateFromUser === void 0 || stateFromUser === null || isObject(stateFromUser), `history.${funcName}(state) argument state must be an object`);
			const state = isEnhanced(stateFromUser) ? stateFromUser : {
				...stateFromUser,
				vike: {
					scrollPosition: getScrollPosition(),
					timestamp: getTimestamp(),
					triggeredBy: "user"
				}
			};
			funcOriginal(state, ...rest);
			assertIsEnhanced(window.history.state);
			globalObject$2.previous = getHistoryInfo();
			queueMicrotask(() => {
				if (isEnhanced(window.history.state)) return;
				Object.assign(state, window.history.state);
				replaceHistoryStateOriginal(state);
			});
		};
	});
}
function isEnhanced(state) {
	if (state?.vike) return true;
	return false;
}
function assertIsEnhanced(state) {
	if (isEnhanced(state)) return;
	assert(false, { state });
}
function getHistoryInfo() {
	return {
		url: getCurrentUrl(),
		state: getState()
	};
}
function onPopStateBegin() {
	const { previous } = globalObject$2;
	const isStateEnhanced = isEnhanced(window.history.state);
	const isStatePristine = window.history.state === null;
	if (!isStateEnhanced && !isStatePristine) {
		redirectHard(getCurrentUrl());
		return { skip: true };
	}
	if (!isStateEnhanced) enhance();
	const current = getHistoryInfo();
	globalObject$2.previous = current;
	if (isStatePristine) return { skip: true };
	return {
		previous,
		current
	};
}
function initHistory() {
	monkeyPatchHistoryAPI();
	enhance();
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/onPageVisibilityChange.js
function onPageHide(listener) {
	window.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "hidden") listener();
	});
}
function onPageShow(listener) {
	window.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible") listener();
	});
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/sleep.js
function sleep(milliseconds) {
	return new Promise((r) => setTimeout(r, milliseconds));
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/utils/throttle.js
function throttle(func, waitTime) {
	let isQueued = false;
	return () => {
		if (!isQueued) {
			isQueued = true;
			setTimeout(() => {
				isQueued = false;
				func();
			}, waitTime);
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/setScrollPosition.js
function setScrollPosition(scrollTarget, url) {
	if (!scrollTarget && url && hasTextFragment(url)) {
		scrollToTextFragment(url);
		return;
	}
	if (isScrollPosition(scrollTarget)) {
		setScroll(scrollTarget);
		return;
	}
	if (scrollTarget?.preserveScroll) return;
	scrollToHashOrTop(getUrlHash());
}
function scrollToTextFragment(url) {
	const stateOriginal = window.history.state;
	replaceHistoryStateOriginal(null, url);
	assert(window.history.state === null);
	window.location.replace(url);
	replaceHistoryStateOriginal(stateOriginal, url);
}
function hasTextFragment(url) {
	return url.includes("#") && url.includes(":~:text");
}
function scrollToHashOrTop(hash) {
	if (!hash) scrollToTop();
	else {
		const id = decodeURIComponent(hash);
		const hashTarget = document.getElementById(id) || document.getElementsByName(id)[0];
		if (hashTarget) {
			hashTarget.scrollIntoView();
			hashTarget.focus();
		} else if (hash === "top") scrollToTop();
	}
}
function scrollToTop() {
	setScroll({
		x: 0,
		y: 0
	});
}
function isScrollPosition(scrollTarget) {
	return scrollTarget?.y !== void 0;
}
/**
* Change the browser's scroll position, in a way that works during a repaint.
*
* I don't remember exactly why I implemented this and what I meant with "repaint"
* - https://github.com/vikejs/vike/commit/fd70fadb0bcea8d922f961f1c88713994e0aaf34
* - I guess scrolling doesn't work during a page rendering? So we have to re-scroll until the scroll position is correct?
* - Do other frameworks implement this? SvelteKit doesn't seem to.
* - Let's remove it and see if users complain?
*/
function setScroll(scrollPosition) {
	const scroll = () => {
		window.scrollTo(scrollPosition.x, scrollPosition.y);
	};
	const done = () => {
		return window.scrollX === scrollPosition.x && window.scrollY === scrollPosition.y;
	};
	if (done()) return;
	scroll();
	if (done()) return;
	requestAnimationFrame(() => {
		scroll();
		if (done()) return;
		setTimeout(async () => {
			scroll();
			if (done()) return;
			const start = (/* @__PURE__ */ new Date()).getTime();
			while (true) {
				await sleep(10);
				scroll();
				if (done()) return;
				if ((/* @__PURE__ */ new Date()).getTime() - start > 100) return;
			}
		}, 0);
	});
}
function getUrlHash() {
	let { hash } = window.location;
	if (hash === "") return null;
	assert(hash.startsWith("#"));
	hash = hash.slice(1);
	return hash;
}
function autoSaveScrollPosition() {
	window.addEventListener("scroll", throttle(saveScrollPosition, 300), { passive: true });
	onPageHide(saveScrollPosition);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/scrollRestoration.js
var globalObject$1 = getGlobalObject("scrollRestoration.ts", {});
function scrollRestoration_init() {
	scrollRestoration_enable();
	onPageHide(scrollRestoration_enable);
	onPageShow(() => globalObject$1.initialRenderIsDone && scrollRestoration_disable());
}
function scrollRestoration_initialRenderIsDone() {
	globalObject$1.initialRenderIsDone = true;
	scrollRestoration_disable();
}
function scrollRestoration_disable() {
	if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
}
function scrollRestoration_enable() {
	if ("scrollRestoration" in window.history) window.history.scrollRestoration = "auto";
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/logErrorClient.js
function logErrorClient(err) {
	if (isObject(err) && err.isAlreadyLogged) return;
	console.error(err);
}
//#endregion
//#region ../../node_modules/.pnpm/vike@0.4.258_react-streaming@0.4.3_react-dom@19.1.1_react@19.1.1__react@19.1.1__srvx@0._b207b9f8c7ea0b559072b65938e06ac0/node_modules/vike/dist/client/runtime-client-routing/renderPageClient.js
var globalObject = getGlobalObject("renderPageClient.ts", (() => {
	const { promise: hydrationAwaitPromise, resolve: hydrationAwaitPromiseResolve } = genPromise();
	return {
		renderCounter: 0,
		hydrationAwaitPromise,
		hydrationAwaitPromiseResolve
	};
})());
async function renderPageClient(renderArgs) {
	catchInfiniteLoop("renderPageClient()");
	const { urlOriginal = getCurrentUrl(), overwriteLastHistoryEntry = false, isBackwardNavigation = false, isHistoryNavigation = false, doNotRenderIfSamePage, isClientSideNavigation = true, pageContextInitClient, pageContextsAborted = [] } = renderArgs;
	let { scrollTarget } = renderArgs;
	const { previousPageContext } = globalObject;
	addLinkPrefetchHandlers_unwatch();
	const { isRenderOutdated, setHydrationCanBeAborted, isFirstRender } = getIsRenderOutdated();
	const pageContextBeginArgs = {
		urlOriginal,
		isBackwardNavigation,
		isHistoryNavigation,
		pageContextsAborted,
		isClientSideNavigation,
		pageContextInitClient,
		isFirstRender
	};
	if (globalObject.clientRoutingIsDisabled) {
		redirectHard(urlOriginal);
		return;
	}
	if (!isFirstRender) {
		await globalObject.hydrationAwaitPromise;
		if (isRenderOutdated()) return;
	}
	await globalObject.onRenderClientPreviousPromise;
	if (isRenderOutdated()) return;
	return await renderPageNominal();
	async function renderPageNominal() {
		const onError = async (err) => {
			await handleError({ err });
		};
		const pageContext = await getPageContextBegin(false, pageContextBeginArgs);
		if (isRenderOutdated()) return;
		if (globalObject.isFirstRenderDone) {
			assert(previousPageContext);
			if (!globalObject.isTransitioning) {
				globalObject.isTransitioning = true;
				const hooks = getHooksFromPageContextNew("onPageTransitionStart", previousPageContext);
				try {
					await execHookList(hooks, pageContext, getPageContextPublicClientMinimal);
				} catch (err) {
					await onError(err);
					return;
				}
				if (isRenderOutdated()) return;
			}
		}
		if (isFirstRender) {
			const pageContextSerialized = getPageContextFromHooksServer_firstRender();
			assert(!("urlOriginal" in pageContextSerialized));
			objectAssign(pageContext, pageContextSerialized);
			populatePageContextPrefetchCache(pageContext, { pageContextFromHooksServer: pageContextSerialized });
		}
		{
			let pageContextFromRoute;
			try {
				pageContextFromRoute = await route(pageContext);
			} catch (err) {
				await onError(err);
				return;
			}
			if (isRenderOutdated()) return;
			assert(!("urlOriginal" in pageContextFromRoute));
			if (isFirstRender) {
				const { pageId: _, routeParams: __, ...rest } = pageContextFromRoute;
				objectAssign(pageContext, rest);
				assert(hasProp(pageContext, "routeParams", "string{}"));
			} else objectAssign(pageContext, pageContextFromRoute);
			if (!isFirstRender) {
				if (!pageContextFromRoute.pageId) {
					redirectHard(urlOriginal);
					return;
				}
				const isClientRoutable = await isClientSideRoutable(pageContextFromRoute.pageId, pageContext);
				if (isRenderOutdated()) return;
				if (!isClientRoutable) {
					redirectHard(urlOriginal);
					return;
				}
				const isSamePage = pageContextFromRoute.pageId && previousPageContext?.pageId && pageContextFromRoute.pageId === previousPageContext.pageId;
				if (doNotRenderIfSamePage && isSamePage) return;
			}
		}
		assert(hasProp(pageContext, "pageId", "string"));
		const res = await loadPageConfigsLazyClientSideAndExecHook(pageContext, isFirstRender, isRenderOutdated);
		if (res.skip) return;
		if ("err" in res) {
			await onError(res.err);
			return;
		}
		updateType(pageContext, res.pageContext);
		setPageContextCurrent(pageContext);
		if (pageContext.exports.hydrationCanBeAborted) setHydrationCanBeAborted();
		if (isRenderOutdated()) return;
		if (isFirstRender) {
			assert(hasProp(pageContext, "_hasPageContextFromServer", "true"));
			let pageContextAugmented;
			try {
				pageContextAugmented = await getPageContextFromHooksClient_firstRender(pageContext);
			} catch (err) {
				await onError(err);
				return;
			}
			if (isRenderOutdated()) return;
			updateType(pageContext, pageContextAugmented);
			return await renderPageView(pageContext);
		} else {
			let pageContextFromHooksServer;
			const pageContextPrefetched = getPageContextPrefetched(pageContext);
			if (pageContextPrefetched) pageContextFromHooksServer = pageContextPrefetched;
			else try {
				const result = await getPageContextFromHooksServer(pageContext, false);
				if (result.is404ServerSideRouted) return;
				pageContextFromHooksServer = result.pageContextFromHooksServer;
				populatePageContextPrefetchCache(pageContext, result);
			} catch (err) {
				await onError(err);
				return;
			}
			if (isRenderOutdated()) return;
			assert(!("urlOriginal" in pageContextFromHooksServer));
			objectAssign(pageContext, pageContextFromHooksServer);
			let pageContextFromHooksClient;
			try {
				pageContextFromHooksClient = await getPageContextFromHooksClient(pageContext, false);
			} catch (err) {
				await onError(err);
				return;
			}
			if (isRenderOutdated()) return;
			updateType(pageContext, pageContextFromHooksClient);
			return await renderPageView(pageContext);
		}
	}
	async function handleError(args) {
		const { err } = args;
		assert(err);
		if (!isAbortError(err)) logErrorClient(err);
		const pageContext = await getPageContextBegin(true, pageContextBeginArgs);
		if (isRenderOutdated()) return;
		objectAssign(pageContext, { errorWhileRendering: err });
		let pageContextAbort;
		if (isAbortError(err)) {
			const res = await handleAbort(err, pageContext);
			if (res.skip) return;
			pageContextAbort = res.pageContextAbort;
		}
		await renderErrorPage(pageContext, args, pageContextAbort);
	}
	async function renderErrorPage(pageContext, args, pageContextAbort) {
		const onError = (err) => {
			logErrorClient(err);
		};
		const errorPageId = getErrorPageId(pageContext._pageFilesAll, pageContext._globalContext._pageConfigs);
		if (!errorPageId) throw new Error("No error page defined.");
		objectAssign(pageContext, {
			pageId: errorPageId,
			routeParams: {}
		});
		if (pageContextAbort) {
			assert(pageContextAbort.abortStatusCode);
			assert(!("urlOriginal" in pageContextAbort));
			objectAssign(pageContext, pageContextAbort);
			objectAssign(pageContext, { is404: pageContextAbort.abortStatusCode === 404 });
		} else objectAssign(pageContext, { is404: false });
		const isClientRoutable = await isClientSideRoutable(pageContext.pageId, pageContext);
		if (isRenderOutdated()) return;
		if (!isClientRoutable) {
			redirectHard(urlOriginal);
			return;
		}
		const res = await loadPageConfigsLazyClientSideAndExecHook(pageContext, isFirstRender, isRenderOutdated);
		if (res.skip) return;
		if ("err" in res) {
			onError(res.err);
			return;
		}
		updateType(pageContext, res.pageContext);
		setPageContextCurrent(pageContext);
		let pageContextFromHooksServer;
		try {
			const result = await getPageContextFromHooksServer(pageContext, true);
			if (result.is404ServerSideRouted) return;
			pageContextFromHooksServer = result.pageContextFromHooksServer;
		} catch (err) {
			onError(err);
			return;
		}
		if (isRenderOutdated()) return;
		assert(!("urlOriginal" in pageContextFromHooksServer));
		objectAssign(pageContext, pageContextFromHooksServer);
		let pageContextFromHooksClient;
		try {
			pageContextFromHooksClient = await getPageContextFromHooksClient(pageContext, true);
		} catch (err) {
			onError(err);
			return;
		}
		if (isRenderOutdated()) return;
		updateType(pageContext, pageContextFromHooksClient);
		await renderPageView(pageContext, args);
	}
	async function handleAbort(err, pageContext) {
		const errAbort = err;
		logAbort(err, true, pageContext);
		const pageContextAbort = errAbort._pageContextAbort;
		addNewPageContextAborted(pageContextsAborted, pageContext, pageContextAbort);
		if (pageContextAbort._urlRewrite) {
			await renderPageClient({
				...renderArgs,
				scrollTarget: void 0,
				pageContextsAborted
			});
			return { skip: true };
		}
		if (pageContextAbort._urlRedirect) {
			const urlRedirect = pageContextAbort._urlRedirect.url;
			if (!urlRedirect.startsWith("/")) {
				redirectHard(urlRedirect);
				return { skip: true };
			} else await renderPageClient({
				...renderArgs,
				scrollTarget: void 0,
				urlOriginal: urlRedirect,
				overwriteLastHistoryEntry: false,
				pageContextsAborted
			});
			return { skip: true };
		}
		return { pageContextAbort };
	}
	async function renderPageView(pageContext, isErrorPage) {
		const onError = async (err) => {
			if (!isErrorPage) await handleError({ err });
			else logErrorClient(err);
		};
		changeUrl(urlOriginal, overwriteLastHistoryEntry);
		globalObject.previousPageContext = pageContext;
		assert(globalObject.onRenderClientPreviousPromise === void 0);
		const onRenderClientPromise = (async () => {
			let onRenderClientError;
			try {
				await execHookOnRenderClient(pageContext, getPageContextPublicClient);
			} catch (err) {
				assert(err);
				onRenderClientError = err;
			}
			globalObject.onRenderClientPreviousPromise = void 0;
			globalObject.isFirstRenderDone = true;
			return onRenderClientError;
		})();
		globalObject.onRenderClientPreviousPromise = onRenderClientPromise;
		const onRenderClientError = await onRenderClientPromise;
		if (onRenderClientError) {
			await onError(onRenderClientError);
			if (!isErrorPage) return;
		}
		if (isFirstRender && !onRenderClientError) {
			try {
				await execHook("onHydrationEnd", pageContext, getPageContextPublicClient);
			} catch (err) {
				await onError(err);
				if (!isErrorPage) return;
			}
			if (isRenderOutdated(true)) return;
		}
		if (isRenderOutdated(true)) return;
		if (globalObject.isTransitioning) {
			globalObject.isTransitioning = void 0;
			assert(previousPageContext);
			const hooks = getHooksFromPageContextNew("onPageTransitionEnd", previousPageContext);
			try {
				await execHookList(hooks, pageContext, getPageContextPublicClient);
			} catch (err) {
				await onError(err);
				if (!isErrorPage) return;
			}
			if (isRenderOutdated(true)) return;
		}
		if (!scrollTarget && previousPageContext) {
			const keepScrollPositionPrev = getKeepScrollPositionSetting(previousPageContext);
			const keepScrollPositionNext = getKeepScrollPositionSetting(pageContext);
			if (keepScrollPositionNext !== false && keepScrollPositionPrev !== false && areKeysEqual(keepScrollPositionNext, keepScrollPositionPrev)) scrollTarget = { preserveScroll: true };
		}
		setScrollPosition(scrollTarget, urlOriginal);
		if (isScrollPosition(scrollTarget)) saveScrollPosition(scrollTarget);
		scrollRestoration_initialRenderIsDone();
		if (pageContext._hasPageContextFromServer) setPageContextInitIsPassedToClient(pageContext);
		addLinkPrefetchHandlers_watch();
		addLinkPrefetchHandlers();
		globalObject.renderedPageContext = pageContext;
		stampFinished(urlOriginal);
		globalObject.hydrationAwaitPromiseResolve();
		return pageContext;
	}
}
async function getPageContextBegin(isForErrorPage, { urlOriginal, isBackwardNavigation, isHistoryNavigation, pageContextsAborted, isClientSideNavigation, pageContextInitClient, isFirstRender }) {
	const previousPageContext = globalObject.previousPageContext ?? null;
	const pageContext = await createPageContextClient(urlOriginal);
	objectAssign(pageContext, {
		isBackwardNavigation,
		isHistoryNavigation,
		isClientSideNavigation,
		isHydration: isFirstRender && !isForErrorPage,
		previousPageContext,
		pageContextsAborted,
		...pageContextInitClient
	});
	globalObject.currentPageContext = pageContext;
	Object.defineProperty(pageContext, "_previousPageContext", {
		get() {
			assertWarning(false, "pageContext._previousPageContext has been renamed pageContext.previousPageContext", {
				showStackTrace: true,
				onlyOnce: true
			});
			return previousPageContext;
		},
		enumerable: false
	});
	{
		const pageContextAddendumAbort = getPageContextAddendumAbort(pageContextsAborted);
		assert(!pageContextAddendumAbort || !("urlOriginal" in pageContextAddendumAbort));
		objectAssign(pageContext, pageContextAddendumAbort);
	}
	return pageContext;
}
function stampFinished(urlOriginal) {
	window._vike ?? (window._vike = {});
	window._vike.fullyRenderedUrl = urlOriginal;
}
function changeUrl(url, overwriteLastHistoryEntry) {
	if (getCurrentUrl() === url) return;
	pushHistoryState(url, overwriteLastHistoryEntry);
}
function disableClientRouting(err, log) {
	globalObject.clientRoutingIsDisabled = true;
	assert(isErrorFetchingStaticAssets(err));
	if (log) console.log(err);
	assertInfo(false, [
		"Failed to fetch static asset.",
		"This usually happens when a new frontend is deployed.",
		"Falling back to Server Routing.",
		"(The next page navigation will use Server Routing instead of Client Routing.)"
	].filter(Boolean).join(" "), { onlyOnce: true });
}
function getIsRenderOutdated() {
	const renderNumber = ++globalObject.renderCounter;
	assert(renderNumber >= 1);
	let hydrationCanBeAborted = false;
	const setHydrationCanBeAborted = () => {
		hydrationCanBeAborted = true;
		globalObject.hydrationAwaitPromiseResolve();
	};
	/** Whether the rendering should be aborted because a new rendering has started. We should call this after each `await`. */
	const isRenderOutdated = (isRenderCleanup) => {
		if (renderNumber === 1 && !hydrationCanBeAborted && !isRenderCleanup) return false;
		return renderNumber !== globalObject.renderCounter;
	};
	return {
		isRenderOutdated,
		setHydrationCanBeAborted,
		isFirstRender: renderNumber === 1
	};
}
function getRenderCount() {
	return globalObject.renderCounter;
}
function getKeepScrollPositionSetting(pageContext) {
	const c = pageContext.from.configsStandard.keepScrollPosition;
	if (!c) return false;
	let val = c.value;
	const configDefinedAt = c.definedAt;
	assert(configDefinedAt);
	const routeParameterList = getRouteStringParameterList(configDefinedAt);
	if (isCallable(val)) val = val(pageContext, { configDefinedAt: c.definedAt });
	if (val === true) return [configDefinedAt, ...routeParameterList.map((param) => {
		const val = pageContext.routeParams[param];
		assert(val);
		return val;
	})];
	return val;
}
function areKeysEqual(key1, key2) {
	if (key1 === key2) return true;
	if (!Array.isArray(key1) || !Array.isArray(key2)) return false;
	return key1.length === key2.length && key1.every((_, i) => key1[i] === key2[i]);
}
async function loadPageConfigsLazyClientSideAndExecHook(pageContext, isFirstRender, isRenderOutdated) {
	let hasErr = false;
	let err;
	let pageContextAddendum;
	try {
		pageContextAddendum = await loadPageConfigsLazyClientSide(pageContext.pageId, pageContext._pageFilesAll, pageContext._globalContext._pageConfigs, pageContext._globalContext._pageConfigGlobal);
	} catch (err_) {
		err = err_;
		hasErr = true;
		if (handleErrorFetchingStaticAssets(err, pageContext, isFirstRender)) return { skip: true };
	}
	if (isRenderOutdated()) return { skip: true };
	if (hasErr) return { err };
	objectAssign(pageContext, pageContextAddendum);
	try {
		await execHook("onCreatePageContext", pageContext, getPageContextPublicClient);
	} catch (err_) {
		err = err;
		hasErr = true;
	}
	if (isRenderOutdated()) return { skip: true };
	if (hasErr) return { err };
	return { pageContext };
}
function handleErrorFetchingStaticAssets(err, pageContext, isFirstRender) {
	if (!isErrorFetchingStaticAssets(err)) return false;
	if (isFirstRender) {
		disableClientRouting(err, false);
		throw err;
	} else disableClientRouting(err, true);
	redirectHard(pageContext.urlOriginal);
	return true;
}
//#endregion
export { providePageContext as _, scrollToHashOrTop as a, getGlobalObject as b, onPopStateBegin as c, isHrefCurrentUrl as d, isLinkIgnored as f, catchInfiniteLoop as g, setVirtualFileExportsGlobalEntry as h, autoSaveScrollPosition as i, initLinkPrefetchHandlers as l, assertClientRouting as m, renderPageClient as n, setScrollPosition as o, isLinkSkipped as p, scrollRestoration_init as r, initHistory as s, getRenderCount as t, normalizeUrlArgument as u, assert as v, assertSingleInstance_onClientEntryClientRouting as y };
