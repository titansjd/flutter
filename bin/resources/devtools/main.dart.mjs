
// Compiles a dart2wasm-generated main module from `source` which can then
// instantiatable via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm modules from `bytes` which is then
// instantiatable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

// DEPRECATED: Please use `compile` or `compileStreaming` to get a compiled app,
// use `instantiate` method to get an instantiated app and then call
// `invokeMain` to invoke the main function.
export async function instantiate(modulePromise, importObjectPromise) {
  var moduleOrCompiledApp = await modulePromise;
  if (!(moduleOrCompiledApp instanceof CompiledApp)) {
    moduleOrCompiledApp = new CompiledApp(moduleOrCompiledApp);
  }
  const instantiatedApp = await moduleOrCompiledApp.instantiate(await importObjectPromise);
  return instantiatedApp.instantiatedModule;
}

// DEPRECATED: Please use `compile` or `compileStreaming` to get a compiled app,
// use `instantiate` method to get an instantiated app and then call
// `invokeMain` to invoke the main function.
export const invoke = (moduleInstance, ...args) => {
  moduleInstance.exports.$invokeMain(args);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredWasm` is a JS function that takes a module name matching a
  //   wasm file produced by the dart2wasm compiler and returns the bytes to
  //   load the module. These bytes can be in either a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  async instantiate(additionalImports, {loadDeferredWasm} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + js;
    }

    // Converts a Dart List to a JS array. Any Dart objects will be converted, but
    // this will be cheap for JSValues.
    function arrayFromDartList(constructor, list) {
      const exports = dartInstance.exports;
      const read = exports.$listRead;
      const length = exports.$listLength(list);
      const array = new constructor(length);
      for (let i = 0; i < length; i++) {
        array[i] = read(list, i);
      }
      return array;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {

      _1: (x0,x1,x2) => x0.set(x1,x2),
      _2: (x0,x1,x2) => x0.set(x1,x2),
      _6: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._6(f,arguments.length,x0) }),
      _7: x0 => new window.FinalizationRegistry(x0),
      _8: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      _9: (x0,x1) => x0.unregister(x1),
      _10: (x0,x1,x2) => x0.slice(x1,x2),
      _11: (x0,x1) => x0.decode(x1),
      _12: (x0,x1) => x0.segment(x1),
      _13: () => new TextDecoder(),
      _14: x0 => x0.buffer,
      _15: x0 => x0.wasmMemory,
      _16: () => globalThis.window._flutter_skwasmInstance,
      _17: x0 => x0.rasterStartMilliseconds,
      _18: x0 => x0.rasterEndMilliseconds,
      _19: x0 => x0.imageBitmaps,
      _192: x0 => x0.select(),
      _193: (x0,x1) => x0.append(x1),
      _194: x0 => x0.remove(),
      _197: x0 => x0.unlock(),
      _202: x0 => x0.getReader(),
      _211: x0 => new MutationObserver(x0),
      _222: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _223: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      _226: x0 => new ResizeObserver(x0),
      _229: (x0,x1) => new Intl.Segmenter(x0,x1),
      _230: x0 => x0.next(),
      _231: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      _308: x0 => x0.close(),
      _309: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      _310: x0 => new window.ImageDecoder(x0),
      _311: x0 => x0.close(),
      _312: x0 => ({frameIndex: x0}),
      _313: (x0,x1) => x0.decode(x1),
      _316: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._316(f,arguments.length,x0) }),
      _317: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._317(f,arguments.length,x0) }),
      _318: (x0,x1) => ({addView: x0,removeView: x1}),
      _319: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._319(f,arguments.length,x0) }),
      _320: f => finalizeWrapper(f, function() { return dartInstance.exports._320(f,arguments.length) }),
      _321: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      _322: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._322(f,arguments.length,x0) }),
      _323: x0 => ({runApp: x0}),
      _324: x0 => new Uint8Array(x0),
      _326: x0 => x0.preventDefault(),
      _327: x0 => x0.stopPropagation(),
      _328: (x0,x1) => x0.addListener(x1),
      _329: (x0,x1) => x0.removeListener(x1),
      _330: (x0,x1) => x0.prepend(x1),
      _331: x0 => x0.remove(),
      _332: x0 => x0.disconnect(),
      _333: (x0,x1) => x0.addListener(x1),
      _334: (x0,x1) => x0.removeListener(x1),
      _335: x0 => x0.blur(),
      _336: (x0,x1) => x0.append(x1),
      _337: x0 => x0.remove(),
      _338: x0 => x0.stopPropagation(),
      _342: x0 => x0.preventDefault(),
      _343: (x0,x1) => x0.append(x1),
      _344: x0 => x0.remove(),
      _345: x0 => x0.preventDefault(),
      _350: (x0,x1) => x0.removeChild(x1),
      _351: (x0,x1) => x0.appendChild(x1),
      _352: (x0,x1,x2) => x0.insertBefore(x1,x2),
      _353: (x0,x1) => x0.appendChild(x1),
      _354: (x0,x1) => x0.transferFromImageBitmap(x1),
      _355: (x0,x1) => x0.appendChild(x1),
      _356: (x0,x1) => x0.append(x1),
      _357: (x0,x1) => x0.append(x1),
      _358: (x0,x1) => x0.append(x1),
      _359: x0 => x0.remove(),
      _360: x0 => x0.remove(),
      _361: x0 => x0.remove(),
      _362: (x0,x1) => x0.appendChild(x1),
      _363: (x0,x1) => x0.appendChild(x1),
      _364: x0 => x0.remove(),
      _365: (x0,x1) => x0.append(x1),
      _366: (x0,x1) => x0.append(x1),
      _367: x0 => x0.remove(),
      _368: (x0,x1) => x0.append(x1),
      _369: (x0,x1) => x0.append(x1),
      _370: (x0,x1,x2) => x0.insertBefore(x1,x2),
      _371: (x0,x1) => x0.append(x1),
      _372: (x0,x1,x2) => x0.insertBefore(x1,x2),
      _373: x0 => x0.remove(),
      _374: (x0,x1) => x0.append(x1),
      _375: x0 => x0.remove(),
      _376: (x0,x1) => x0.append(x1),
      _377: x0 => x0.remove(),
      _378: x0 => x0.remove(),
      _379: x0 => x0.getBoundingClientRect(),
      _380: x0 => x0.remove(),
      _393: (x0,x1) => x0.append(x1),
      _394: x0 => x0.remove(),
      _395: (x0,x1) => x0.append(x1),
      _396: (x0,x1,x2) => x0.insertBefore(x1,x2),
      _397: x0 => x0.preventDefault(),
      _398: x0 => x0.preventDefault(),
      _399: x0 => x0.preventDefault(),
      _400: x0 => x0.preventDefault(),
      _401: (x0,x1) => x0.observe(x1),
      _402: x0 => x0.disconnect(),
      _403: (x0,x1) => x0.appendChild(x1),
      _404: (x0,x1) => x0.appendChild(x1),
      _405: (x0,x1) => x0.appendChild(x1),
      _406: (x0,x1) => x0.append(x1),
      _407: x0 => x0.remove(),
      _408: (x0,x1) => x0.append(x1),
      _409: (x0,x1) => x0.append(x1),
      _410: (x0,x1) => x0.appendChild(x1),
      _411: (x0,x1) => x0.append(x1),
      _412: x0 => x0.remove(),
      _413: (x0,x1) => x0.append(x1),
      _414: x0 => x0.remove(),
      _418: (x0,x1) => x0.appendChild(x1),
      _419: x0 => x0.remove(),
      _978: () => globalThis.window.flutterConfiguration,
      _979: x0 => x0.assetBase,
      _984: x0 => x0.debugShowSemanticsNodes,
      _985: x0 => x0.hostElement,
      _986: x0 => x0.multiViewEnabled,
      _987: x0 => x0.nonce,
      _989: x0 => x0.fontFallbackBaseUrl,
      _995: x0 => x0.console,
      _996: x0 => x0.devicePixelRatio,
      _997: x0 => x0.document,
      _998: x0 => x0.history,
      _999: x0 => x0.innerHeight,
      _1000: x0 => x0.innerWidth,
      _1001: x0 => x0.location,
      _1002: x0 => x0.navigator,
      _1003: x0 => x0.visualViewport,
      _1004: x0 => x0.performance,
      _1007: (x0,x1) => x0.dispatchEvent(x1),
      _1008: (x0,x1) => x0.matchMedia(x1),
      _1010: (x0,x1) => x0.getComputedStyle(x1),
      _1011: x0 => x0.screen,
      _1012: (x0,x1) => x0.requestAnimationFrame(x1),
      _1013: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1013(f,arguments.length,x0) }),
      _1018: (x0,x1) => x0.warn(x1),
      _1020: (x0,x1) => x0.debug(x1),
      _1021: () => globalThis.window,
      _1022: () => globalThis.Intl,
      _1023: () => globalThis.Symbol,
      _1026: x0 => x0.clipboard,
      _1027: x0 => x0.maxTouchPoints,
      _1028: x0 => x0.vendor,
      _1029: x0 => x0.language,
      _1030: x0 => x0.platform,
      _1031: x0 => x0.userAgent,
      _1032: x0 => x0.languages,
      _1033: x0 => x0.documentElement,
      _1034: (x0,x1) => x0.querySelector(x1),
      _1038: (x0,x1) => x0.createElement(x1),
      _1039: (x0,x1) => x0.execCommand(x1),
      _1042: (x0,x1) => x0.createTextNode(x1),
      _1043: (x0,x1) => x0.createEvent(x1),
      _1047: x0 => x0.head,
      _1048: x0 => x0.body,
      _1049: (x0,x1) => x0.title = x1,
      _1052: x0 => x0.activeElement,
      _1054: x0 => x0.visibilityState,
      _1056: x0 => x0.hasFocus(),
      _1057: () => globalThis.document,
      _1058: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _1059: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _1062: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1062(f,arguments.length,x0) }),
      _1063: x0 => x0.target,
      _1065: x0 => x0.timeStamp,
      _1066: x0 => x0.type,
      _1068: x0 => x0.preventDefault(),
      _1070: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      _1076: x0 => x0.baseURI,
      _1077: x0 => x0.firstChild,
      _1082: x0 => x0.parentElement,
      _1084: x0 => x0.parentNode,
      _1088: (x0,x1) => x0.removeChild(x1),
      _1089: (x0,x1) => x0.removeChild(x1),
      _1090: x0 => x0.isConnected,
      _1091: (x0,x1) => x0.textContent = x1,
      _1095: (x0,x1) => x0.contains(x1),
      _1101: x0 => x0.firstElementChild,
      _1103: x0 => x0.nextElementSibling,
      _1104: x0 => x0.clientHeight,
      _1105: x0 => x0.clientWidth,
      _1106: x0 => x0.offsetHeight,
      _1107: x0 => x0.offsetWidth,
      _1108: x0 => x0.id,
      _1109: (x0,x1) => x0.id = x1,
      _1112: (x0,x1) => x0.spellcheck = x1,
      _1113: x0 => x0.tagName,
      _1114: x0 => x0.style,
      _1115: (x0,x1) => x0.append(x1),
      _1117: (x0,x1) => x0.getAttribute(x1),
      _1118: x0 => x0.getBoundingClientRect(),
      _1121: (x0,x1) => x0.closest(x1),
      _1124: (x0,x1) => x0.querySelectorAll(x1),
      _1126: x0 => x0.remove(),
      _1127: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _1128: (x0,x1) => x0.removeAttribute(x1),
      _1129: (x0,x1) => x0.tabIndex = x1,
      _1132: (x0,x1) => x0.focus(x1),
      _1133: x0 => x0.scrollTop,
      _1134: (x0,x1) => x0.scrollTop = x1,
      _1135: x0 => x0.scrollLeft,
      _1136: (x0,x1) => x0.scrollLeft = x1,
      _1137: x0 => x0.classList,
      _1138: (x0,x1) => x0.className = x1,
      _1144: (x0,x1) => x0.getElementsByClassName(x1),
      _1146: x0 => x0.click(),
      _1147: (x0,x1) => x0.hasAttribute(x1),
      _1150: (x0,x1) => x0.attachShadow(x1),
      _1155: (x0,x1) => x0.getPropertyValue(x1),
      _1157: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      _1159: (x0,x1) => x0.removeProperty(x1),
      _1161: x0 => x0.offsetLeft,
      _1162: x0 => x0.offsetTop,
      _1163: x0 => x0.offsetParent,
      _1165: (x0,x1) => x0.name = x1,
      _1166: x0 => x0.content,
      _1167: (x0,x1) => x0.content = x1,
      _1185: (x0,x1) => x0.nonce = x1,
      _1191: x0 => x0.now(),
      _1193: (x0,x1) => x0.width = x1,
      _1195: (x0,x1) => x0.height = x1,
      _1199: (x0,x1) => x0.getContext(x1),
      _1275: (x0,x1) => x0.fetch(x1),
      _1276: x0 => x0.status,
      _1277: x0 => x0.headers,
      _1278: x0 => x0.body,
      _1279: x0 => x0.arrayBuffer(),
      _1282: (x0,x1) => x0.get(x1),
      _1285: x0 => x0.read(),
      _1286: x0 => x0.value,
      _1287: x0 => x0.done,
      _1289: x0 => x0.name,
      _1290: x0 => x0.x,
      _1291: x0 => x0.y,
      _1294: x0 => x0.top,
      _1295: x0 => x0.right,
      _1296: x0 => x0.bottom,
      _1297: x0 => x0.left,
      _1306: x0 => x0.height,
      _1307: x0 => x0.width,
      _1308: (x0,x1) => x0.value = x1,
      _1310: (x0,x1) => x0.placeholder = x1,
      _1311: (x0,x1) => x0.name = x1,
      _1312: x0 => x0.selectionDirection,
      _1313: x0 => x0.selectionStart,
      _1314: x0 => x0.selectionEnd,
      _1317: x0 => x0.value,
      _1319: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      _1322: x0 => x0.readText(),
      _1323: (x0,x1) => x0.writeText(x1),
      _1324: x0 => x0.altKey,
      _1325: x0 => x0.code,
      _1326: x0 => x0.ctrlKey,
      _1327: x0 => x0.key,
      _1328: x0 => x0.keyCode,
      _1329: x0 => x0.location,
      _1330: x0 => x0.metaKey,
      _1331: x0 => x0.repeat,
      _1332: x0 => x0.shiftKey,
      _1333: x0 => x0.isComposing,
      _1334: (x0,x1) => x0.getModifierState(x1),
      _1336: x0 => x0.state,
      _1337: (x0,x1) => x0.go(x1),
      _1339: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      _1341: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      _1342: x0 => x0.pathname,
      _1343: x0 => x0.search,
      _1344: x0 => x0.hash,
      _1348: x0 => x0.state,
      _1356: f => finalizeWrapper(f, function(x0,x1) { return dartInstance.exports._1356(f,arguments.length,x0,x1) }),
      _1358: (x0,x1,x2) => x0.observe(x1,x2),
      _1361: x0 => x0.attributeName,
      _1362: x0 => x0.type,
      _1363: x0 => x0.matches,
      _1366: x0 => x0.matches,
      _1368: x0 => x0.relatedTarget,
      _1369: x0 => x0.clientX,
      _1370: x0 => x0.clientY,
      _1371: x0 => x0.offsetX,
      _1372: x0 => x0.offsetY,
      _1375: x0 => x0.button,
      _1376: x0 => x0.buttons,
      _1377: x0 => x0.ctrlKey,
      _1378: (x0,x1) => x0.getModifierState(x1),
      _1381: x0 => x0.pointerId,
      _1382: x0 => x0.pointerType,
      _1383: x0 => x0.pressure,
      _1384: x0 => x0.tiltX,
      _1385: x0 => x0.tiltY,
      _1386: x0 => x0.getCoalescedEvents(),
      _1388: x0 => x0.deltaX,
      _1389: x0 => x0.deltaY,
      _1390: x0 => x0.wheelDeltaX,
      _1391: x0 => x0.wheelDeltaY,
      _1392: x0 => x0.deltaMode,
      _1398: x0 => x0.changedTouches,
      _1400: x0 => x0.clientX,
      _1401: x0 => x0.clientY,
      _1403: x0 => x0.data,
      _1406: (x0,x1) => x0.disabled = x1,
      _1407: (x0,x1) => x0.type = x1,
      _1408: (x0,x1) => x0.max = x1,
      _1409: (x0,x1) => x0.min = x1,
      _1410: (x0,x1) => x0.value = x1,
      _1411: x0 => x0.value,
      _1412: x0 => x0.disabled,
      _1413: (x0,x1) => x0.disabled = x1,
      _1414: (x0,x1) => x0.placeholder = x1,
      _1415: (x0,x1) => x0.name = x1,
      _1416: (x0,x1) => x0.autocomplete = x1,
      _1417: x0 => x0.selectionDirection,
      _1418: x0 => x0.selectionStart,
      _1419: x0 => x0.selectionEnd,
      _1423: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      _1428: (x0,x1) => x0.add(x1),
      _1432: (x0,x1) => x0.noValidate = x1,
      _1433: (x0,x1) => x0.method = x1,
      _1434: (x0,x1) => x0.action = x1,
      _1459: x0 => x0.orientation,
      _1460: x0 => x0.width,
      _1461: x0 => x0.height,
      _1462: (x0,x1) => x0.lock(x1),
      _1478: f => finalizeWrapper(f, function(x0,x1) { return dartInstance.exports._1478(f,arguments.length,x0,x1) }),
      _1489: x0 => x0.length,
      _1491: (x0,x1) => x0.item(x1),
      _1492: x0 => x0.length,
      _1493: (x0,x1) => x0.item(x1),
      _1494: x0 => x0.iterator,
      _1495: x0 => x0.Segmenter,
      _1496: x0 => x0.v8BreakIterator,
      _1499: x0 => x0.done,
      _1500: x0 => x0.value,
      _1501: x0 => x0.index,
      _1505: (x0,x1) => x0.adoptText(x1),
      _1506: x0 => x0.first(),
      _1507: x0 => x0.next(),
      _1508: x0 => x0.current(),
      _1522: x0 => x0.hostElement,
      _1523: x0 => x0.viewConstraints,
      _1525: x0 => x0.maxHeight,
      _1526: x0 => x0.maxWidth,
      _1527: x0 => x0.minHeight,
      _1528: x0 => x0.minWidth,
      _1529: x0 => x0.loader,
      _1530: () => globalThis._flutter,
      _1531: (x0,x1) => x0.didCreateEngineInitializer(x1),
      _1532: (x0,x1,x2) => x0.call(x1,x2),
      _1533: f => finalizeWrapper(f, function(x0,x1) { return dartInstance.exports._1533(f,arguments.length,x0,x1) }),
      _1534: x0 => new Promise(x0),
      _1537: x0 => x0.length,
      _1540: x0 => x0.tracks,
      _1544: x0 => x0.image,
      _1551: x0 => x0.displayWidth,
      _1552: x0 => x0.displayHeight,
      _1553: x0 => x0.duration,
      _1556: x0 => x0.ready,
      _1557: x0 => x0.selectedTrack,
      _1558: x0 => x0.repetitionCount,
      _1559: x0 => x0.frameCount,
      _1604: (x0,x1) => x0.querySelectorAll(x1),
      _1605: (x0,x1) => x0.removeChild(x1),
      _1606: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1606(f,arguments.length,x0) }),
      _1607: (x0,x1) => x0.forEach(x1),
      _1608: x0 => x0.preventDefault(),
      _1609: (x0,x1,x2) => x0.postMessage(x1,x2),
      _1610: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1610(f,arguments.length,x0) }),
      _1611: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _1612: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      _1613: x0 => x0.preventDefault(),
      _1614: x0 => x0.preventDefault(),
      _1615: (x0,x1) => x0.item(x1),
      _1616: () => new FileReader(),
      _1617: (x0,x1) => x0.readAsText(x1),
      _1618: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1618(f,arguments.length,x0) }),
      _1619: () => globalThis.initializeGA(),
      _1621: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11,x12,x13,x14,x15,x16,x17,x18,x19,x20,x21,x22,x23,x24,x25,x26,x27,x28,x29,x30,x31,x32,x33) => ({screen: x0,event_category: x1,event_label: x2,send_to: x3,value: x4,non_interaction: x5,user_app: x6,user_build: x7,user_platform: x8,devtools_platform: x9,devtools_chrome: x10,devtools_version: x11,ide_launched: x12,flutter_client_id: x13,is_external_build: x14,is_embedded: x15,g3_username: x16,ide_launched_feature: x17,is_wasm: x18,ui_duration_micros: x19,raster_duration_micros: x20,shader_compilation_duration_micros: x21,cpu_sample_count: x22,cpu_stack_depth: x23,trace_event_count: x24,heap_diff_objects_before: x25,heap_diff_objects_after: x26,heap_objects_total: x27,root_set_count: x28,row_count: x29,inspector_tree_controller_id: x30,android_app_id: x31,ios_bundle_id: x32,is_v2_inspector: x33}),
      _1622: x0 => x0.screen,
      _1623: x0 => x0.user_app,
      _1624: x0 => x0.user_build,
      _1625: x0 => x0.user_platform,
      _1626: x0 => x0.devtools_platform,
      _1627: x0 => x0.devtools_chrome,
      _1628: x0 => x0.devtools_version,
      _1629: x0 => x0.ide_launched,
      _1631: x0 => x0.is_external_build,
      _1632: x0 => x0.is_embedded,
      _1633: x0 => x0.g3_username,
      _1634: x0 => x0.ide_launched_feature,
      _1635: x0 => x0.is_wasm,
      _1636: x0 => x0.ui_duration_micros,
      _1637: x0 => x0.raster_duration_micros,
      _1638: x0 => x0.shader_compilation_duration_micros,
      _1639: x0 => x0.cpu_sample_count,
      _1640: x0 => x0.cpu_stack_depth,
      _1641: x0 => x0.trace_event_count,
      _1642: x0 => x0.heap_diff_objects_before,
      _1643: x0 => x0.heap_diff_objects_after,
      _1644: x0 => x0.heap_objects_total,
      _1645: x0 => x0.root_set_count,
      _1646: x0 => x0.row_count,
      _1647: x0 => x0.inspector_tree_controller_id,
      _1648: x0 => x0.android_app_id,
      _1649: x0 => x0.ios_bundle_id,
      _1650: x0 => x0.is_v2_inspector,
      _1652: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11,x12,x13,x14,x15,x16,x17,x18,x19,x20,x21,x22,x23,x24,x25,x26,x27,x28,x29) => ({description: x0,fatal: x1,user_app: x2,user_build: x3,user_platform: x4,devtools_platform: x5,devtools_chrome: x6,devtools_version: x7,ide_launched: x8,flutter_client_id: x9,is_external_build: x10,is_embedded: x11,g3_username: x12,ide_launched_feature: x13,is_wasm: x14,ui_duration_micros: x15,raster_duration_micros: x16,shader_compilation_duration_micros: x17,cpu_sample_count: x18,cpu_stack_depth: x19,trace_event_count: x20,heap_diff_objects_before: x21,heap_diff_objects_after: x22,heap_objects_total: x23,root_set_count: x24,row_count: x25,inspector_tree_controller_id: x26,android_app_id: x27,ios_bundle_id: x28,is_v2_inspector: x29}),
      _1653: x0 => x0.user_app,
      _1654: x0 => x0.user_build,
      _1655: x0 => x0.user_platform,
      _1656: x0 => x0.devtools_platform,
      _1657: x0 => x0.devtools_chrome,
      _1658: x0 => x0.devtools_version,
      _1659: x0 => x0.ide_launched,
      _1661: x0 => x0.is_external_build,
      _1662: x0 => x0.is_embedded,
      _1663: x0 => x0.g3_username,
      _1664: x0 => x0.ide_launched_feature,
      _1665: x0 => x0.is_wasm,
      _1681: () => globalThis.getDevToolsPropertyID(),
      _1682: () => globalThis.getDevToolsPropertyID(),
      _1683: () => globalThis.getDevToolsPropertyID(),
      _1684: () => globalThis.getDevToolsPropertyID(),
      _1686: () => globalThis.hookupListenerForGA(),
      _1687: (x0,x1,x2) => globalThis.gtag(x0,x1,x2),
      _1689: x0 => x0.event_category,
      _1690: x0 => x0.event_label,
      _1692: x0 => x0.value,
      _1693: x0 => x0.non_interaction,
      _1696: x0 => x0.description,
      _1697: x0 => x0.fatal,
      _1698: (x0,x1) => x0.createElement(x1),
      _1699: x0 => new Blob(x0),
      _1700: x0 => globalThis.URL.createObjectURL(x0),
      _1701: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _1702: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _1703: (x0,x1) => x0.append(x1),
      _1704: x0 => x0.click(),
      _1705: x0 => x0.remove(),
      _1706: x0 => x0.decode(),
      _1707: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _1708: (x0,x1,x2) => x0.setRequestHeader(x1,x2),
      _1709: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1709(f,arguments.length,x0) }),
      _1710: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _1711: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1711(f,arguments.length,x0) }),
      _1712: x0 => x0.send(),
      _1713: () => new XMLHttpRequest(),
      _1714: (x0,x1) => x0.createElement(x1),
      _1715: () => globalThis.window.navigator.userAgent,
      _1716: x0 => x0.createRange(),
      _1717: (x0,x1) => x0.selectNode(x1),
      _1718: x0 => x0.getSelection(),
      _1719: x0 => x0.removeAllRanges(),
      _1720: (x0,x1) => x0.addRange(x1),
      _1721: (x0,x1) => x0.add(x1),
      _1722: (x0,x1) => x0.append(x1),
      _1723: (x0,x1,x2) => x0.insertRule(x1,x2),
      _1724: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1724(f,arguments.length,x0) }),
      _1726: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _1727: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      _1741: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _1742: (x0,x1) => x0.querySelector(x1),
      _1743: (x0,x1) => x0.appendChild(x1),
      _1744: (x0,x1) => x0.appendChild(x1),
      _1745: (x0,x1) => x0.item(x1),
      _1746: x0 => x0.remove(),
      _1747: x0 => x0.remove(),
      _1748: x0 => x0.remove(),
      _1749: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1749(f,arguments.length,x0) }),
      _1750: x0 => x0.click(),
      _1751: x0 => globalThis.URL.createObjectURL(x0),
      _1761: () => new Array(),
      _1762: x0 => new Array(x0),
      _1764: x0 => x0.length,
      _1766: (x0,x1) => x0[x1],
      _1767: (x0,x1,x2) => x0[x1] = x2,
      _1770: (x0,x1,x2) => new DataView(x0,x1,x2),
      _1772: x0 => new Int8Array(x0),
      _1773: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      _1774: x0 => new Uint8Array(x0),
      _1778: x0 => new Int16Array(x0),
      _1780: x0 => new Uint16Array(x0),
      _1782: x0 => new Int32Array(x0),
      _1784: x0 => new Uint32Array(x0),
      _1786: x0 => new Float32Array(x0),
      _1788: x0 => new Float64Array(x0),
      _1789: (o, t) => typeof o === t,
      _1790: (o, c) => o instanceof c,
      _1794: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1794(f,arguments.length,x0) }),
      _1795: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1795(f,arguments.length,x0) }),
      _1820: (decoder, codeUnits) => decoder.decode(codeUnits),
      _1821: () => new TextDecoder("utf-8", {fatal: true}),
      _1822: () => new TextDecoder("utf-8", {fatal: false}),
      _1823: x0 => new WeakRef(x0),
      _1824: x0 => x0.deref(),
      _1830: Date.now,
      _1832: s => new Date(s * 1000).getTimezoneOffset() * 60,
      _1833: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      _1834: () => {
        let stackString = new Error().stack.toString();
        let frames = stackString.split('\n');
        let drop = 2;
        if (frames[0] === 'Error') {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      _1835: () => typeof dartUseDateNowForTicks !== "undefined",
      _1836: () => 1000 * performance.now(),
      _1837: () => Date.now(),
      _1838: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      _1839: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      _1840: () => new WeakMap(),
      _1841: (map, o) => map.get(o),
      _1842: (map, o, v) => map.set(o, v),
      _1843: () => globalThis.WeakRef,
      _1854: s => JSON.stringify(s),
      _1855: s => printToConsole(s),
      _1856: a => a.join(''),
      _1857: (o, a, b) => o.replace(a, b),
      _1859: (s, t) => s.split(t),
      _1860: s => s.toLowerCase(),
      _1861: s => s.toUpperCase(),
      _1862: s => s.trim(),
      _1863: s => s.trimLeft(),
      _1864: s => s.trimRight(),
      _1866: (s, p, i) => s.indexOf(p, i),
      _1867: (s, p, i) => s.lastIndexOf(p, i),
      _1868: (s) => s.replace(/\$/g, "$$$$"),
      _1869: Object.is,
      _1870: s => s.toUpperCase(),
      _1871: s => s.toLowerCase(),
      _1872: (a, i) => a.push(i),
      _1873: (a, i) => a.splice(i, 1)[0],
      _1875: (a, l) => a.length = l,
      _1876: a => a.pop(),
      _1877: (a, i) => a.splice(i, 1),
      _1879: (a, s) => a.join(s),
      _1880: (a, s, e) => a.slice(s, e),
      _1881: (a, s, e) => a.splice(s, e),
      _1882: (a, b) => a == b ? 0 : (a > b ? 1 : -1),
      _1883: a => a.length,
      _1884: (a, l) => a.length = l,
      _1885: (a, i) => a[i],
      _1886: (a, i, v) => a[i] = v,
      _1888: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      _1889: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      _1890: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      _1891: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      _1892: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      _1893: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      _1894: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      _1895: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      _1897: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      _1898: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      _1899: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      _1900: (t, s) => t.set(s),
      _1902: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      _1903: o => o.byteLength,
      _1904: o => o.buffer,
      _1905: o => o.byteOffset,
      _1906: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      _1907: (b, o) => new DataView(b, o),
      _1908: (b, o, l) => new DataView(b, o, l),
      _1909: Function.prototype.call.bind(DataView.prototype.getUint8),
      _1910: Function.prototype.call.bind(DataView.prototype.setUint8),
      _1911: Function.prototype.call.bind(DataView.prototype.getInt8),
      _1912: Function.prototype.call.bind(DataView.prototype.setInt8),
      _1913: Function.prototype.call.bind(DataView.prototype.getUint16),
      _1914: Function.prototype.call.bind(DataView.prototype.setUint16),
      _1915: Function.prototype.call.bind(DataView.prototype.getInt16),
      _1916: Function.prototype.call.bind(DataView.prototype.setInt16),
      _1917: Function.prototype.call.bind(DataView.prototype.getUint32),
      _1918: Function.prototype.call.bind(DataView.prototype.setUint32),
      _1919: Function.prototype.call.bind(DataView.prototype.getInt32),
      _1920: Function.prototype.call.bind(DataView.prototype.setInt32),
      _1923: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      _1924: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      _1925: Function.prototype.call.bind(DataView.prototype.getFloat32),
      _1926: Function.prototype.call.bind(DataView.prototype.setFloat32),
      _1927: Function.prototype.call.bind(DataView.prototype.getFloat64),
      _1928: Function.prototype.call.bind(DataView.prototype.setFloat64),
      _1941: (o, t) => o instanceof t,
      _1943: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1943(f,arguments.length,x0) }),
      _1944: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1944(f,arguments.length,x0) }),
      _1945: o => Object.keys(o),
      _1946: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      _1947: (handle) => clearTimeout(handle),
      _1948: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      _1949: (handle) => clearInterval(handle),
      _1950: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      _1951: () => Date.now(),
      _1952: (x0,x1) => new WebSocket(x0,x1),
      _1953: (x0,x1) => x0.send(x1),
      _1954: (x0,x1) => x0.send(x1),
      _1955: (x0,x1,x2) => x0.close(x1,x2),
      _1957: x0 => x0.close(),
      _1958: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      _1959: (x0,x1,x2) => x0.fetch(x1,x2),
      _1960: (x0,x1) => x0.get(x1),
      _1961: f => finalizeWrapper(f, function(x0,x1,x2) { return dartInstance.exports._1961(f,arguments.length,x0,x1,x2) }),
      _1962: (x0,x1) => x0.forEach(x1),
      _1963: x0 => x0.abort(),
      _1964: () => new AbortController(),
      _1965: x0 => x0.getReader(),
      _1966: x0 => x0.read(),
      _1967: x0 => x0.cancel(),
      _1969: x0 => ({withCredentials: x0}),
      _1970: (x0,x1) => new EventSource(x0,x1),
      _1971: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1971(f,arguments.length,x0) }),
      _1972: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1972(f,arguments.length,x0) }),
      _1973: x0 => x0.close(),
      _1974: (x0,x1,x2) => ({method: x0,body: x1,credentials: x2}),
      _1978: () => new XMLHttpRequest(),
      _1979: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _1980: x0 => x0.send(),
      _1982: () => new FileReader(),
      _1983: (x0,x1) => x0.readAsArrayBuffer(x1),
      _1992: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1992(f,arguments.length,x0) }),
      _1993: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._1993(f,arguments.length,x0) }),
      _2003: x0 => ({body: x0}),
      _2004: (x0,x1) => new Notification(x0,x1),
      _2005: () => globalThis.Notification.requestPermission(),
      _2006: x0 => x0.close(),
      _2008: (x0,x1) => x0.groupCollapsed(x1),
      _2009: (x0,x1) => x0.log(x1),
      _2010: x0 => x0.groupEnd(),
      _2011: (x0,x1) => x0.log(x1),
      _2012: (x0,x1) => x0.warn(x1),
      _2013: (x0,x1) => x0.error(x1),
      _2014: (x0,x1) => x0.replace(x1),
      _2015: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      _2016: x0 => x0.reload(),
      _2029: (x0,x1) => x0.getItem(x1),
      _2030: (x0,x1,x2) => x0.setItem(x1,x2),
      _2032: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      _2033: (x0,x1) => x0.exec(x1),
      _2034: (x0,x1) => x0.test(x1),
      _2035: (x0,x1) => x0.exec(x1),
      _2036: (x0,x1) => x0.exec(x1),
      _2037: x0 => x0.pop(),
      _2039: o => o === undefined,
      _2058: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      _2060: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      _2061: o => o instanceof RegExp,
      _2062: (l, r) => l === r,
      _2063: o => o,
      _2064: o => o,
      _2065: o => o,
      _2066: b => !!b,
      _2067: o => o.length,
      _2070: (o, i) => o[i],
      _2071: f => f.dartFunction,
      _2072: l => arrayFromDartList(Int8Array, l),
      _2073: l => arrayFromDartList(Uint8Array, l),
      _2074: l => arrayFromDartList(Uint8ClampedArray, l),
      _2075: l => arrayFromDartList(Int16Array, l),
      _2076: l => arrayFromDartList(Uint16Array, l),
      _2077: l => arrayFromDartList(Int32Array, l),
      _2078: l => arrayFromDartList(Uint32Array, l),
      _2079: l => arrayFromDartList(Float32Array, l),
      _2080: l => arrayFromDartList(Float64Array, l),
      _2081: x0 => new ArrayBuffer(x0),
      _2082: (data, length) => {
        const getValue = dartInstance.exports.$byteDataGetUint8;
        const view = new DataView(new ArrayBuffer(length));
        for (let i = 0; i < length; i++) {
          view.setUint8(i, getValue(data, i));
        }
        return view;
      },
      _2083: l => arrayFromDartList(Array, l),
      _2084: () => ({}),
      _2085: () => [],
      _2086: l => new Array(l),
      _2087: () => globalThis,
      _2088: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      _2089: (o, p) => p in o,
      _2090: (o, p) => o[p],
      _2091: (o, p, v) => o[p] = v,
      _2092: (o, m, a) => o[m].apply(o, a),
      _2094: o => String(o),
      _2095: (p, s, f) => p.then(s, f),
      _2096: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        return 17;
      },
      _2097: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _2098: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _2099: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _2100: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _2101: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _2102: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _2103: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _2104: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _2105: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _2106: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _2107: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      _2109: x0 => x0.input,
      _2110: x0 => x0.index,
      _2111: x0 => x0.groups,
      _2113: (x0,x1) => x0.exec(x1),
      _2115: x0 => x0.flags,
      _2116: x0 => x0.multiline,
      _2117: x0 => x0.ignoreCase,
      _2118: x0 => x0.unicode,
      _2119: x0 => x0.dotAll,
      _2120: (x0,x1) => x0.lastIndex = x1,
      _2122: (o, p) => o[p],
      _2125: x0 => x0.random(),
      _2126: x0 => x0.random(),
      _2130: () => globalThis.Math,
      _2132: v => v.toString(),
      _2133: (d, digits) => d.toFixed(digits),
      _2136: (d, precision) => d.toPrecision(precision),
      _2137: () => globalThis.document,
      _2138: () => globalThis.window,
      _2143: (x0,x1) => x0.height = x1,
      _2145: (x0,x1) => x0.width = x1,
      _2149: x0 => x0.head,
      _2152: x0 => x0.classList,
      _2157: (x0,x1) => x0.innerText = x1,
      _2158: x0 => x0.style,
      _2160: x0 => x0.sheet,
      _2161: x0 => x0.src,
      _2162: (x0,x1) => x0.src = x1,
      _2163: x0 => x0.naturalWidth,
      _2164: x0 => x0.naturalHeight,
      _2172: x0 => x0.offsetX,
      _2173: x0 => x0.offsetY,
      _2174: x0 => x0.button,
      _2189: x0 => x0.status,
      _2190: (x0,x1) => x0.responseType = x1,
      _2192: x0 => x0.response,
      _2250: (x0,x1) => x0.responseType = x1,
      _2251: x0 => x0.response,
      _2331: x0 => x0.style,
      _2809: (x0,x1) => x0.src = x1,
      _2816: (x0,x1) => x0.allow = x1,
      _2828: x0 => x0.contentWindow,
      _3263: (x0,x1) => x0.accept = x1,
      _3277: x0 => x0.files,
      _3303: (x0,x1) => x0.multiple = x1,
      _3321: (x0,x1) => x0.type = x1,
      _4042: (x0,x1) => x0.dropEffect = x1,
      _4047: x0 => x0.files,
      _4059: x0 => x0.dataTransfer,
      _4063: () => globalThis.window,
      _4108: x0 => x0.location,
      _4109: x0 => x0.history,
      _4125: x0 => x0.parent,
      _4127: x0 => x0.navigator,
      _4391: x0 => x0.localStorage,
      _4401: x0 => x0.origin,
      _4410: x0 => x0.pathname,
      _4425: x0 => x0.state,
      _4450: x0 => x0.message,
      _4513: x0 => x0.appVersion,
      _4514: x0 => x0.platform,
      _4517: x0 => x0.userAgent,
      _4518: x0 => x0.vendor,
      _4568: x0 => x0.data,
      _4569: x0 => x0.origin,
      _4957: x0 => x0.readyState,
      _4966: x0 => x0.protocol,
      _4970: (x0,x1) => x0.binaryType = x1,
      _4973: x0 => x0.code,
      _4974: x0 => x0.reason,
      _6717: x0 => x0.type,
      _6760: x0 => x0.signal,
      _6825: x0 => x0.parentNode,
      _6839: () => globalThis.document,
      _6932: x0 => x0.body,
      _7643: x0 => x0.offsetX,
      _7644: x0 => x0.offsetY,
      _7729: x0 => x0.key,
      _7730: x0 => x0.code,
      _7731: x0 => x0.location,
      _7732: x0 => x0.ctrlKey,
      _7733: x0 => x0.shiftKey,
      _7734: x0 => x0.altKey,
      _7735: x0 => x0.metaKey,
      _7736: x0 => x0.repeat,
      _7737: x0 => x0.isComposing,
      _8664: x0 => x0.value,
      _8666: x0 => x0.done,
      _8852: x0 => x0.size,
      _8853: x0 => x0.type,
      _8860: x0 => x0.name,
      _8861: x0 => x0.lastModified,
      _8867: x0 => x0.length,
      _8878: x0 => x0.result,
      _9386: x0 => x0.url,
      _9388: x0 => x0.status,
      _9390: x0 => x0.statusText,
      _9391: x0 => x0.headers,
      _9392: x0 => x0.body,
      _11502: (x0,x1) => x0.backgroundColor = x1,
      _11548: (x0,x1) => x0.border = x1,
      _11826: (x0,x1) => x0.display = x1,
      _11990: (x0,x1) => x0.height = x1,
      _12680: (x0,x1) => x0.width = x1,
      _13786: () => globalThis.console,
      _13815: () => globalThis.window.flutterCanvasKit,
      _13816: () => globalThis.window._flutter_skwasmInstance,

    };

    const baseImports = {
      dart2wasm: dart2wasm,


      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
    };

    const deferredLibraryHelper = {
      "loadModule": async (moduleName) => {
        if (!loadDeferredWasm) {
          throw "No implementation of loadDeferredWasm provided.";
        }
        const source = await Promise.resolve(loadDeferredWasm(moduleName));
        const module = await ((source instanceof Response)
            ? WebAssembly.compileStreaming(source, this.builtins)
            : WebAssembly.compile(source, this.builtins));
        return await WebAssembly.instantiate(module, {
          ...baseImports,
          ...additionalImports,
          "wasm:js-string": jsStringPolyfill,
          "module0": dartInstance.exports,
        });
      },
    };

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      "deferredLibraryHelper": deferredLibraryHelper,
      "wasm:js-string": jsStringPolyfill,
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}

