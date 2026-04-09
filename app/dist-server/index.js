var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../modules/system/node_modules/reflect-metadata/Reflect.js
var require_Reflect = __commonJS({
  "../modules/system/node_modules/reflect-metadata/Reflect.js"() {
    "use strict";
    var Reflect2;
    (function(Reflect3) {
      (function(factory) {
        var root = typeof globalThis === "object" ? globalThis : typeof global === "object" ? global : typeof self === "object" ? self : typeof this === "object" ? this : sloppyModeThis();
        var exporter = makeExporter(Reflect3);
        if (typeof root.Reflect !== "undefined") {
          exporter = makeExporter(root.Reflect, exporter);
        }
        factory(exporter, root);
        if (typeof root.Reflect === "undefined") {
          root.Reflect = Reflect3;
        }
        function makeExporter(target, previous) {
          return function(key, value) {
            Object.defineProperty(target, key, {
              configurable: true,
              writable: true,
              value
            });
            if (previous) previous(key, value);
          };
        }
        __name(makeExporter, "makeExporter");
        function functionThis() {
          try {
            return Function("return this;")();
          } catch (_) {
          }
        }
        __name(functionThis, "functionThis");
        function indirectEvalThis() {
          try {
            return (0, eval)("(function() { return this; })()");
          } catch (_) {
          }
        }
        __name(indirectEvalThis, "indirectEvalThis");
        function sloppyModeThis() {
          return functionThis() || indirectEvalThis();
        }
        __name(sloppyModeThis, "sloppyModeThis");
      })(function(exporter, root) {
        var hasOwn = Object.prototype.hasOwnProperty;
        var supportsSymbol = typeof Symbol === "function";
        var toPrimitiveSymbol = supportsSymbol && typeof Symbol.toPrimitive !== "undefined" ? Symbol.toPrimitive : "@@toPrimitive";
        var iteratorSymbol = supportsSymbol && typeof Symbol.iterator !== "undefined" ? Symbol.iterator : "@@iterator";
        var supportsCreate = typeof Object.create === "function";
        var supportsProto = {
          __proto__: []
        } instanceof Array;
        var downLevel = !supportsCreate && !supportsProto;
        var HashMap = {
          // create an object in dictionary mode (a.k.a. "slow" mode in v8)
          create: supportsCreate ? function() {
            return MakeDictionary(/* @__PURE__ */ Object.create(null));
          } : supportsProto ? function() {
            return MakeDictionary({
              __proto__: null
            });
          } : function() {
            return MakeDictionary({});
          },
          has: downLevel ? function(map, key) {
            return hasOwn.call(map, key);
          } : function(map, key) {
            return key in map;
          },
          get: downLevel ? function(map, key) {
            return hasOwn.call(map, key) ? map[key] : void 0;
          } : function(map, key) {
            return map[key];
          }
        };
        var functionPrototype = Object.getPrototypeOf(Function);
        var _Map = typeof Map === "function" && typeof Map.prototype.entries === "function" ? Map : CreateMapPolyfill();
        var _Set = typeof Set === "function" && typeof Set.prototype.entries === "function" ? Set : CreateSetPolyfill();
        var _WeakMap = typeof WeakMap === "function" ? WeakMap : CreateWeakMapPolyfill();
        var registrySymbol = supportsSymbol ? /* @__PURE__ */ Symbol.for("@reflect-metadata:registry") : void 0;
        var metadataRegistry = GetOrCreateMetadataRegistry();
        var metadataProvider = CreateMetadataProvider(metadataRegistry);
        function decorate(decorators, target, propertyKey, attributes) {
          if (!IsUndefined(propertyKey)) {
            if (!IsArray(decorators)) throw new TypeError();
            if (!IsObject(target)) throw new TypeError();
            if (!IsObject(attributes) && !IsUndefined(attributes) && !IsNull(attributes)) throw new TypeError();
            if (IsNull(attributes)) attributes = void 0;
            propertyKey = ToPropertyKey(propertyKey);
            return DecorateProperty(decorators, target, propertyKey, attributes);
          } else {
            if (!IsArray(decorators)) throw new TypeError();
            if (!IsConstructor(target)) throw new TypeError();
            return DecorateConstructor(decorators, target);
          }
        }
        __name(decorate, "decorate");
        exporter("decorate", decorate);
        function metadata(metadataKey, metadataValue) {
          function decorator(target, propertyKey) {
            if (!IsObject(target)) throw new TypeError();
            if (!IsUndefined(propertyKey) && !IsPropertyKey(propertyKey)) throw new TypeError();
            OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
          }
          __name(decorator, "decorator");
          return decorator;
        }
        __name(metadata, "metadata");
        exporter("metadata", metadata);
        function defineMetadata(metadataKey, metadataValue, target, propertyKey) {
          if (!IsObject(target)) throw new TypeError();
          if (!IsUndefined(propertyKey)) propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
        }
        __name(defineMetadata, "defineMetadata");
        exporter("defineMetadata", defineMetadata);
        function hasMetadata(metadataKey, target, propertyKey) {
          if (!IsObject(target)) throw new TypeError();
          if (!IsUndefined(propertyKey)) propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryHasMetadata(metadataKey, target, propertyKey);
        }
        __name(hasMetadata, "hasMetadata");
        exporter("hasMetadata", hasMetadata);
        function hasOwnMetadata(metadataKey, target, propertyKey) {
          if (!IsObject(target)) throw new TypeError();
          if (!IsUndefined(propertyKey)) propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryHasOwnMetadata(metadataKey, target, propertyKey);
        }
        __name(hasOwnMetadata, "hasOwnMetadata");
        exporter("hasOwnMetadata", hasOwnMetadata);
        function getMetadata(metadataKey, target, propertyKey) {
          if (!IsObject(target)) throw new TypeError();
          if (!IsUndefined(propertyKey)) propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryGetMetadata(metadataKey, target, propertyKey);
        }
        __name(getMetadata, "getMetadata");
        exporter("getMetadata", getMetadata);
        function getOwnMetadata(metadataKey, target, propertyKey) {
          if (!IsObject(target)) throw new TypeError();
          if (!IsUndefined(propertyKey)) propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryGetOwnMetadata(metadataKey, target, propertyKey);
        }
        __name(getOwnMetadata, "getOwnMetadata");
        exporter("getOwnMetadata", getOwnMetadata);
        function getMetadataKeys(target, propertyKey) {
          if (!IsObject(target)) throw new TypeError();
          if (!IsUndefined(propertyKey)) propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryMetadataKeys(target, propertyKey);
        }
        __name(getMetadataKeys, "getMetadataKeys");
        exporter("getMetadataKeys", getMetadataKeys);
        function getOwnMetadataKeys(target, propertyKey) {
          if (!IsObject(target)) throw new TypeError();
          if (!IsUndefined(propertyKey)) propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryOwnMetadataKeys(target, propertyKey);
        }
        __name(getOwnMetadataKeys, "getOwnMetadataKeys");
        exporter("getOwnMetadataKeys", getOwnMetadataKeys);
        function deleteMetadata(metadataKey, target, propertyKey) {
          if (!IsObject(target)) throw new TypeError();
          if (!IsUndefined(propertyKey)) propertyKey = ToPropertyKey(propertyKey);
          if (!IsObject(target)) throw new TypeError();
          if (!IsUndefined(propertyKey)) propertyKey = ToPropertyKey(propertyKey);
          var provider = GetMetadataProvider(
            target,
            propertyKey,
            /*Create*/
            false
          );
          if (IsUndefined(provider)) return false;
          return provider.OrdinaryDeleteMetadata(metadataKey, target, propertyKey);
        }
        __name(deleteMetadata, "deleteMetadata");
        exporter("deleteMetadata", deleteMetadata);
        function DecorateConstructor(decorators, target) {
          for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            var decorated = decorator(target);
            if (!IsUndefined(decorated) && !IsNull(decorated)) {
              if (!IsConstructor(decorated)) throw new TypeError();
              target = decorated;
            }
          }
          return target;
        }
        __name(DecorateConstructor, "DecorateConstructor");
        function DecorateProperty(decorators, target, propertyKey, descriptor) {
          for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            var decorated = decorator(target, propertyKey, descriptor);
            if (!IsUndefined(decorated) && !IsNull(decorated)) {
              if (!IsObject(decorated)) throw new TypeError();
              descriptor = decorated;
            }
          }
          return descriptor;
        }
        __name(DecorateProperty, "DecorateProperty");
        function OrdinaryHasMetadata(MetadataKey, O, P) {
          var hasOwn2 = OrdinaryHasOwnMetadata(MetadataKey, O, P);
          if (hasOwn2) return true;
          var parent = OrdinaryGetPrototypeOf(O);
          if (!IsNull(parent)) return OrdinaryHasMetadata(MetadataKey, parent, P);
          return false;
        }
        __name(OrdinaryHasMetadata, "OrdinaryHasMetadata");
        function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
          var provider = GetMetadataProvider(
            O,
            P,
            /*Create*/
            false
          );
          if (IsUndefined(provider)) return false;
          return ToBoolean(provider.OrdinaryHasOwnMetadata(MetadataKey, O, P));
        }
        __name(OrdinaryHasOwnMetadata, "OrdinaryHasOwnMetadata");
        function OrdinaryGetMetadata(MetadataKey, O, P) {
          var hasOwn2 = OrdinaryHasOwnMetadata(MetadataKey, O, P);
          if (hasOwn2) return OrdinaryGetOwnMetadata(MetadataKey, O, P);
          var parent = OrdinaryGetPrototypeOf(O);
          if (!IsNull(parent)) return OrdinaryGetMetadata(MetadataKey, parent, P);
          return void 0;
        }
        __name(OrdinaryGetMetadata, "OrdinaryGetMetadata");
        function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
          var provider = GetMetadataProvider(
            O,
            P,
            /*Create*/
            false
          );
          if (IsUndefined(provider)) return;
          return provider.OrdinaryGetOwnMetadata(MetadataKey, O, P);
        }
        __name(OrdinaryGetOwnMetadata, "OrdinaryGetOwnMetadata");
        function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
          var provider = GetMetadataProvider(
            O,
            P,
            /*Create*/
            true
          );
          provider.OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P);
        }
        __name(OrdinaryDefineOwnMetadata, "OrdinaryDefineOwnMetadata");
        function OrdinaryMetadataKeys(O, P) {
          var ownKeys = OrdinaryOwnMetadataKeys(O, P);
          var parent = OrdinaryGetPrototypeOf(O);
          if (parent === null) return ownKeys;
          var parentKeys = OrdinaryMetadataKeys(parent, P);
          if (parentKeys.length <= 0) return ownKeys;
          if (ownKeys.length <= 0) return parentKeys;
          var set = new _Set();
          var keys = [];
          for (var _i = 0, ownKeys_1 = ownKeys; _i < ownKeys_1.length; _i++) {
            var key = ownKeys_1[_i];
            var hasKey = set.has(key);
            if (!hasKey) {
              set.add(key);
              keys.push(key);
            }
          }
          for (var _a = 0, parentKeys_1 = parentKeys; _a < parentKeys_1.length; _a++) {
            var key = parentKeys_1[_a];
            var hasKey = set.has(key);
            if (!hasKey) {
              set.add(key);
              keys.push(key);
            }
          }
          return keys;
        }
        __name(OrdinaryMetadataKeys, "OrdinaryMetadataKeys");
        function OrdinaryOwnMetadataKeys(O, P) {
          var provider = GetMetadataProvider(
            O,
            P,
            /*create*/
            false
          );
          if (!provider) {
            return [];
          }
          return provider.OrdinaryOwnMetadataKeys(O, P);
        }
        __name(OrdinaryOwnMetadataKeys, "OrdinaryOwnMetadataKeys");
        function Type(x) {
          if (x === null) return 1;
          switch (typeof x) {
            case "undefined":
              return 0;
            case "boolean":
              return 2;
            case "string":
              return 3;
            case "symbol":
              return 4;
            case "number":
              return 5;
            case "object":
              return x === null ? 1 : 6;
            default:
              return 6;
          }
        }
        __name(Type, "Type");
        function IsUndefined(x) {
          return x === void 0;
        }
        __name(IsUndefined, "IsUndefined");
        function IsNull(x) {
          return x === null;
        }
        __name(IsNull, "IsNull");
        function IsSymbol(x) {
          return typeof x === "symbol";
        }
        __name(IsSymbol, "IsSymbol");
        function IsObject(x) {
          return typeof x === "object" ? x !== null : typeof x === "function";
        }
        __name(IsObject, "IsObject");
        function ToPrimitive(input, PreferredType) {
          switch (Type(input)) {
            case 0:
              return input;
            case 1:
              return input;
            case 2:
              return input;
            case 3:
              return input;
            case 4:
              return input;
            case 5:
              return input;
          }
          var hint = PreferredType === 3 ? "string" : PreferredType === 5 ? "number" : "default";
          var exoticToPrim = GetMethod(input, toPrimitiveSymbol);
          if (exoticToPrim !== void 0) {
            var result = exoticToPrim.call(input, hint);
            if (IsObject(result)) throw new TypeError();
            return result;
          }
          return OrdinaryToPrimitive(input, hint === "default" ? "number" : hint);
        }
        __name(ToPrimitive, "ToPrimitive");
        function OrdinaryToPrimitive(O, hint) {
          if (hint === "string") {
            var toString_1 = O.toString;
            if (IsCallable(toString_1)) {
              var result = toString_1.call(O);
              if (!IsObject(result)) return result;
            }
            var valueOf = O.valueOf;
            if (IsCallable(valueOf)) {
              var result = valueOf.call(O);
              if (!IsObject(result)) return result;
            }
          } else {
            var valueOf = O.valueOf;
            if (IsCallable(valueOf)) {
              var result = valueOf.call(O);
              if (!IsObject(result)) return result;
            }
            var toString_2 = O.toString;
            if (IsCallable(toString_2)) {
              var result = toString_2.call(O);
              if (!IsObject(result)) return result;
            }
          }
          throw new TypeError();
        }
        __name(OrdinaryToPrimitive, "OrdinaryToPrimitive");
        function ToBoolean(argument) {
          return !!argument;
        }
        __name(ToBoolean, "ToBoolean");
        function ToString(argument) {
          return "" + argument;
        }
        __name(ToString, "ToString");
        function ToPropertyKey(argument) {
          var key = ToPrimitive(
            argument,
            3
            /* String */
          );
          if (IsSymbol(key)) return key;
          return ToString(key);
        }
        __name(ToPropertyKey, "ToPropertyKey");
        function IsArray(argument) {
          return Array.isArray ? Array.isArray(argument) : argument instanceof Object ? argument instanceof Array : Object.prototype.toString.call(argument) === "[object Array]";
        }
        __name(IsArray, "IsArray");
        function IsCallable(argument) {
          return typeof argument === "function";
        }
        __name(IsCallable, "IsCallable");
        function IsConstructor(argument) {
          return typeof argument === "function";
        }
        __name(IsConstructor, "IsConstructor");
        function IsPropertyKey(argument) {
          switch (Type(argument)) {
            case 3:
              return true;
            case 4:
              return true;
            default:
              return false;
          }
        }
        __name(IsPropertyKey, "IsPropertyKey");
        function SameValueZero(x, y) {
          return x === y || x !== x && y !== y;
        }
        __name(SameValueZero, "SameValueZero");
        function GetMethod(V, P) {
          var func = V[P];
          if (func === void 0 || func === null) return void 0;
          if (!IsCallable(func)) throw new TypeError();
          return func;
        }
        __name(GetMethod, "GetMethod");
        function GetIterator(obj) {
          var method = GetMethod(obj, iteratorSymbol);
          if (!IsCallable(method)) throw new TypeError();
          var iterator = method.call(obj);
          if (!IsObject(iterator)) throw new TypeError();
          return iterator;
        }
        __name(GetIterator, "GetIterator");
        function IteratorValue(iterResult) {
          return iterResult.value;
        }
        __name(IteratorValue, "IteratorValue");
        function IteratorStep(iterator) {
          var result = iterator.next();
          return result.done ? false : result;
        }
        __name(IteratorStep, "IteratorStep");
        function IteratorClose(iterator) {
          var f = iterator["return"];
          if (f) f.call(iterator);
        }
        __name(IteratorClose, "IteratorClose");
        function OrdinaryGetPrototypeOf(O) {
          var proto = Object.getPrototypeOf(O);
          if (typeof O !== "function" || O === functionPrototype) return proto;
          if (proto !== functionPrototype) return proto;
          var prototype = O.prototype;
          var prototypeProto = prototype && Object.getPrototypeOf(prototype);
          if (prototypeProto == null || prototypeProto === Object.prototype) return proto;
          var constructor = prototypeProto.constructor;
          if (typeof constructor !== "function") return proto;
          if (constructor === O) return proto;
          return constructor;
        }
        __name(OrdinaryGetPrototypeOf, "OrdinaryGetPrototypeOf");
        function CreateMetadataRegistry() {
          var fallback;
          if (!IsUndefined(registrySymbol) && typeof root.Reflect !== "undefined" && !(registrySymbol in root.Reflect) && typeof root.Reflect.defineMetadata === "function") {
            fallback = CreateFallbackProvider(root.Reflect);
          }
          var first;
          var second;
          var rest;
          var targetProviderMap = new _WeakMap();
          var registry = {
            registerProvider,
            getProvider,
            setProvider
          };
          return registry;
          function registerProvider(provider) {
            if (!Object.isExtensible(registry)) {
              throw new Error("Cannot add provider to a frozen registry.");
            }
            switch (true) {
              case fallback === provider:
                break;
              case IsUndefined(first):
                first = provider;
                break;
              case first === provider:
                break;
              case IsUndefined(second):
                second = provider;
                break;
              case second === provider:
                break;
              default:
                if (rest === void 0) rest = new _Set();
                rest.add(provider);
                break;
            }
          }
          __name(registerProvider, "registerProvider");
          function getProviderNoCache(O, P) {
            if (!IsUndefined(first)) {
              if (first.isProviderFor(O, P)) return first;
              if (!IsUndefined(second)) {
                if (second.isProviderFor(O, P)) return first;
                if (!IsUndefined(rest)) {
                  var iterator = GetIterator(rest);
                  while (true) {
                    var next = IteratorStep(iterator);
                    if (!next) {
                      return void 0;
                    }
                    var provider = IteratorValue(next);
                    if (provider.isProviderFor(O, P)) {
                      IteratorClose(iterator);
                      return provider;
                    }
                  }
                }
              }
            }
            if (!IsUndefined(fallback) && fallback.isProviderFor(O, P)) {
              return fallback;
            }
            return void 0;
          }
          __name(getProviderNoCache, "getProviderNoCache");
          function getProvider(O, P) {
            var providerMap = targetProviderMap.get(O);
            var provider;
            if (!IsUndefined(providerMap)) {
              provider = providerMap.get(P);
            }
            if (!IsUndefined(provider)) {
              return provider;
            }
            provider = getProviderNoCache(O, P);
            if (!IsUndefined(provider)) {
              if (IsUndefined(providerMap)) {
                providerMap = new _Map();
                targetProviderMap.set(O, providerMap);
              }
              providerMap.set(P, provider);
            }
            return provider;
          }
          __name(getProvider, "getProvider");
          function hasProvider(provider) {
            if (IsUndefined(provider)) throw new TypeError();
            return first === provider || second === provider || !IsUndefined(rest) && rest.has(provider);
          }
          __name(hasProvider, "hasProvider");
          function setProvider(O, P, provider) {
            if (!hasProvider(provider)) {
              throw new Error("Metadata provider not registered.");
            }
            var existingProvider = getProvider(O, P);
            if (existingProvider !== provider) {
              if (!IsUndefined(existingProvider)) {
                return false;
              }
              var providerMap = targetProviderMap.get(O);
              if (IsUndefined(providerMap)) {
                providerMap = new _Map();
                targetProviderMap.set(O, providerMap);
              }
              providerMap.set(P, provider);
            }
            return true;
          }
          __name(setProvider, "setProvider");
        }
        __name(CreateMetadataRegistry, "CreateMetadataRegistry");
        function GetOrCreateMetadataRegistry() {
          var metadataRegistry2;
          if (!IsUndefined(registrySymbol) && IsObject(root.Reflect) && Object.isExtensible(root.Reflect)) {
            metadataRegistry2 = root.Reflect[registrySymbol];
          }
          if (IsUndefined(metadataRegistry2)) {
            metadataRegistry2 = CreateMetadataRegistry();
          }
          if (!IsUndefined(registrySymbol) && IsObject(root.Reflect) && Object.isExtensible(root.Reflect)) {
            Object.defineProperty(root.Reflect, registrySymbol, {
              enumerable: false,
              configurable: false,
              writable: false,
              value: metadataRegistry2
            });
          }
          return metadataRegistry2;
        }
        __name(GetOrCreateMetadataRegistry, "GetOrCreateMetadataRegistry");
        function CreateMetadataProvider(registry) {
          var metadata2 = new _WeakMap();
          var provider = {
            isProviderFor: /* @__PURE__ */ __name(function(O, P) {
              var targetMetadata = metadata2.get(O);
              if (IsUndefined(targetMetadata)) return false;
              return targetMetadata.has(P);
            }, "isProviderFor"),
            OrdinaryDefineOwnMetadata: OrdinaryDefineOwnMetadata2,
            OrdinaryHasOwnMetadata: OrdinaryHasOwnMetadata2,
            OrdinaryGetOwnMetadata: OrdinaryGetOwnMetadata2,
            OrdinaryOwnMetadataKeys: OrdinaryOwnMetadataKeys2,
            OrdinaryDeleteMetadata
          };
          metadataRegistry.registerProvider(provider);
          return provider;
          function GetOrCreateMetadataMap(O, P, Create) {
            var targetMetadata = metadata2.get(O);
            var createdTargetMetadata = false;
            if (IsUndefined(targetMetadata)) {
              if (!Create) return void 0;
              targetMetadata = new _Map();
              metadata2.set(O, targetMetadata);
              createdTargetMetadata = true;
            }
            var metadataMap = targetMetadata.get(P);
            if (IsUndefined(metadataMap)) {
              if (!Create) return void 0;
              metadataMap = new _Map();
              targetMetadata.set(P, metadataMap);
              if (!registry.setProvider(O, P, provider)) {
                targetMetadata.delete(P);
                if (createdTargetMetadata) {
                  metadata2.delete(O);
                }
                throw new Error("Wrong provider for target.");
              }
            }
            return metadataMap;
          }
          __name(GetOrCreateMetadataMap, "GetOrCreateMetadataMap");
          function OrdinaryHasOwnMetadata2(MetadataKey, O, P) {
            var metadataMap = GetOrCreateMetadataMap(
              O,
              P,
              /*Create*/
              false
            );
            if (IsUndefined(metadataMap)) return false;
            return ToBoolean(metadataMap.has(MetadataKey));
          }
          __name(OrdinaryHasOwnMetadata2, "OrdinaryHasOwnMetadata");
          function OrdinaryGetOwnMetadata2(MetadataKey, O, P) {
            var metadataMap = GetOrCreateMetadataMap(
              O,
              P,
              /*Create*/
              false
            );
            if (IsUndefined(metadataMap)) return void 0;
            return metadataMap.get(MetadataKey);
          }
          __name(OrdinaryGetOwnMetadata2, "OrdinaryGetOwnMetadata");
          function OrdinaryDefineOwnMetadata2(MetadataKey, MetadataValue, O, P) {
            var metadataMap = GetOrCreateMetadataMap(
              O,
              P,
              /*Create*/
              true
            );
            metadataMap.set(MetadataKey, MetadataValue);
          }
          __name(OrdinaryDefineOwnMetadata2, "OrdinaryDefineOwnMetadata");
          function OrdinaryOwnMetadataKeys2(O, P) {
            var keys = [];
            var metadataMap = GetOrCreateMetadataMap(
              O,
              P,
              /*Create*/
              false
            );
            if (IsUndefined(metadataMap)) return keys;
            var keysObj = metadataMap.keys();
            var iterator = GetIterator(keysObj);
            var k = 0;
            while (true) {
              var next = IteratorStep(iterator);
              if (!next) {
                keys.length = k;
                return keys;
              }
              var nextValue = IteratorValue(next);
              try {
                keys[k] = nextValue;
              } catch (e) {
                try {
                  IteratorClose(iterator);
                } finally {
                  throw e;
                }
              }
              k++;
            }
          }
          __name(OrdinaryOwnMetadataKeys2, "OrdinaryOwnMetadataKeys");
          function OrdinaryDeleteMetadata(MetadataKey, O, P) {
            var metadataMap = GetOrCreateMetadataMap(
              O,
              P,
              /*Create*/
              false
            );
            if (IsUndefined(metadataMap)) return false;
            if (!metadataMap.delete(MetadataKey)) return false;
            if (metadataMap.size === 0) {
              var targetMetadata = metadata2.get(O);
              if (!IsUndefined(targetMetadata)) {
                targetMetadata.delete(P);
                if (targetMetadata.size === 0) {
                  metadata2.delete(targetMetadata);
                }
              }
            }
            return true;
          }
          __name(OrdinaryDeleteMetadata, "OrdinaryDeleteMetadata");
        }
        __name(CreateMetadataProvider, "CreateMetadataProvider");
        function CreateFallbackProvider(reflect) {
          var defineMetadata2 = reflect.defineMetadata, hasOwnMetadata2 = reflect.hasOwnMetadata, getOwnMetadata2 = reflect.getOwnMetadata, getOwnMetadataKeys2 = reflect.getOwnMetadataKeys, deleteMetadata2 = reflect.deleteMetadata;
          var metadataOwner = new _WeakMap();
          var provider = {
            isProviderFor: /* @__PURE__ */ __name(function(O, P) {
              var metadataPropertySet = metadataOwner.get(O);
              if (!IsUndefined(metadataPropertySet) && metadataPropertySet.has(P)) {
                return true;
              }
              if (getOwnMetadataKeys2(O, P).length) {
                if (IsUndefined(metadataPropertySet)) {
                  metadataPropertySet = new _Set();
                  metadataOwner.set(O, metadataPropertySet);
                }
                metadataPropertySet.add(P);
                return true;
              }
              return false;
            }, "isProviderFor"),
            OrdinaryDefineOwnMetadata: defineMetadata2,
            OrdinaryHasOwnMetadata: hasOwnMetadata2,
            OrdinaryGetOwnMetadata: getOwnMetadata2,
            OrdinaryOwnMetadataKeys: getOwnMetadataKeys2,
            OrdinaryDeleteMetadata: deleteMetadata2
          };
          return provider;
        }
        __name(CreateFallbackProvider, "CreateFallbackProvider");
        function GetMetadataProvider(O, P, Create) {
          var registeredProvider = metadataRegistry.getProvider(O, P);
          if (!IsUndefined(registeredProvider)) {
            return registeredProvider;
          }
          if (Create) {
            if (metadataRegistry.setProvider(O, P, metadataProvider)) {
              return metadataProvider;
            }
            throw new Error("Illegal state.");
          }
          return void 0;
        }
        __name(GetMetadataProvider, "GetMetadataProvider");
        function CreateMapPolyfill() {
          var cacheSentinel = {};
          var arraySentinel = [];
          var MapIterator = (
            /** @class */
            (function() {
              function MapIterator2(keys, values, selector) {
                this._index = 0;
                this._keys = keys;
                this._values = values;
                this._selector = selector;
              }
              __name(MapIterator2, "MapIterator");
              MapIterator2.prototype["@@iterator"] = function() {
                return this;
              };
              MapIterator2.prototype[iteratorSymbol] = function() {
                return this;
              };
              MapIterator2.prototype.next = function() {
                var index = this._index;
                if (index >= 0 && index < this._keys.length) {
                  var result = this._selector(this._keys[index], this._values[index]);
                  if (index + 1 >= this._keys.length) {
                    this._index = -1;
                    this._keys = arraySentinel;
                    this._values = arraySentinel;
                  } else {
                    this._index++;
                  }
                  return {
                    value: result,
                    done: false
                  };
                }
                return {
                  value: void 0,
                  done: true
                };
              };
              MapIterator2.prototype.throw = function(error) {
                if (this._index >= 0) {
                  this._index = -1;
                  this._keys = arraySentinel;
                  this._values = arraySentinel;
                }
                throw error;
              };
              MapIterator2.prototype.return = function(value) {
                if (this._index >= 0) {
                  this._index = -1;
                  this._keys = arraySentinel;
                  this._values = arraySentinel;
                }
                return {
                  value,
                  done: true
                };
              };
              return MapIterator2;
            })()
          );
          var Map1 = (
            /** @class */
            (function() {
              function Map12() {
                this._keys = [];
                this._values = [];
                this._cacheKey = cacheSentinel;
                this._cacheIndex = -2;
              }
              __name(Map12, "Map1");
              Object.defineProperty(Map12.prototype, "size", {
                get: /* @__PURE__ */ __name(function() {
                  return this._keys.length;
                }, "get"),
                enumerable: true,
                configurable: true
              });
              Map12.prototype.has = function(key) {
                return this._find(
                  key,
                  /*insert*/
                  false
                ) >= 0;
              };
              Map12.prototype.get = function(key) {
                var index = this._find(
                  key,
                  /*insert*/
                  false
                );
                return index >= 0 ? this._values[index] : void 0;
              };
              Map12.prototype.set = function(key, value) {
                var index = this._find(
                  key,
                  /*insert*/
                  true
                );
                this._values[index] = value;
                return this;
              };
              Map12.prototype.delete = function(key) {
                var index = this._find(
                  key,
                  /*insert*/
                  false
                );
                if (index >= 0) {
                  var size = this._keys.length;
                  for (var i = index + 1; i < size; i++) {
                    this._keys[i - 1] = this._keys[i];
                    this._values[i - 1] = this._values[i];
                  }
                  this._keys.length--;
                  this._values.length--;
                  if (SameValueZero(key, this._cacheKey)) {
                    this._cacheKey = cacheSentinel;
                    this._cacheIndex = -2;
                  }
                  return true;
                }
                return false;
              };
              Map12.prototype.clear = function() {
                this._keys.length = 0;
                this._values.length = 0;
                this._cacheKey = cacheSentinel;
                this._cacheIndex = -2;
              };
              Map12.prototype.keys = function() {
                return new MapIterator(this._keys, this._values, getKey);
              };
              Map12.prototype.values = function() {
                return new MapIterator(this._keys, this._values, getValue);
              };
              Map12.prototype.entries = function() {
                return new MapIterator(this._keys, this._values, getEntry);
              };
              Map12.prototype["@@iterator"] = function() {
                return this.entries();
              };
              Map12.prototype[iteratorSymbol] = function() {
                return this.entries();
              };
              Map12.prototype._find = function(key, insert) {
                if (!SameValueZero(this._cacheKey, key)) {
                  this._cacheIndex = -1;
                  for (var i = 0; i < this._keys.length; i++) {
                    if (SameValueZero(this._keys[i], key)) {
                      this._cacheIndex = i;
                      break;
                    }
                  }
                }
                if (this._cacheIndex < 0 && insert) {
                  this._cacheIndex = this._keys.length;
                  this._keys.push(key);
                  this._values.push(void 0);
                }
                return this._cacheIndex;
              };
              return Map12;
            })()
          );
          return Map1;
          function getKey(key, _) {
            return key;
          }
          __name(getKey, "getKey");
          function getValue(_, value) {
            return value;
          }
          __name(getValue, "getValue");
          function getEntry(key, value) {
            return [
              key,
              value
            ];
          }
          __name(getEntry, "getEntry");
        }
        __name(CreateMapPolyfill, "CreateMapPolyfill");
        function CreateSetPolyfill() {
          var Set1 = (
            /** @class */
            (function() {
              function Set12() {
                this._map = new _Map();
              }
              __name(Set12, "Set1");
              Object.defineProperty(Set12.prototype, "size", {
                get: /* @__PURE__ */ __name(function() {
                  return this._map.size;
                }, "get"),
                enumerable: true,
                configurable: true
              });
              Set12.prototype.has = function(value) {
                return this._map.has(value);
              };
              Set12.prototype.add = function(value) {
                return this._map.set(value, value), this;
              };
              Set12.prototype.delete = function(value) {
                return this._map.delete(value);
              };
              Set12.prototype.clear = function() {
                this._map.clear();
              };
              Set12.prototype.keys = function() {
                return this._map.keys();
              };
              Set12.prototype.values = function() {
                return this._map.keys();
              };
              Set12.prototype.entries = function() {
                return this._map.entries();
              };
              Set12.prototype["@@iterator"] = function() {
                return this.keys();
              };
              Set12.prototype[iteratorSymbol] = function() {
                return this.keys();
              };
              return Set12;
            })()
          );
          return Set1;
        }
        __name(CreateSetPolyfill, "CreateSetPolyfill");
        function CreateWeakMapPolyfill() {
          var UUID_SIZE = 16;
          var keys = HashMap.create();
          var rootKey = CreateUniqueKey();
          return (
            /** @class */
            (function() {
              function WeakMap1() {
                this._key = CreateUniqueKey();
              }
              __name(WeakMap1, "WeakMap1");
              WeakMap1.prototype.has = function(target) {
                var table = GetOrCreateWeakMapTable(
                  target,
                  /*create*/
                  false
                );
                return table !== void 0 ? HashMap.has(table, this._key) : false;
              };
              WeakMap1.prototype.get = function(target) {
                var table = GetOrCreateWeakMapTable(
                  target,
                  /*create*/
                  false
                );
                return table !== void 0 ? HashMap.get(table, this._key) : void 0;
              };
              WeakMap1.prototype.set = function(target, value) {
                var table = GetOrCreateWeakMapTable(
                  target,
                  /*create*/
                  true
                );
                table[this._key] = value;
                return this;
              };
              WeakMap1.prototype.delete = function(target) {
                var table = GetOrCreateWeakMapTable(
                  target,
                  /*create*/
                  false
                );
                return table !== void 0 ? delete table[this._key] : false;
              };
              WeakMap1.prototype.clear = function() {
                this._key = CreateUniqueKey();
              };
              return WeakMap1;
            })()
          );
          function CreateUniqueKey() {
            var key;
            do
              key = "@@WeakMap@@" + CreateUUID();
            while (HashMap.has(keys, key));
            keys[key] = true;
            return key;
          }
          __name(CreateUniqueKey, "CreateUniqueKey");
          function GetOrCreateWeakMapTable(target, create) {
            if (!hasOwn.call(target, rootKey)) {
              if (!create) return void 0;
              Object.defineProperty(target, rootKey, {
                value: HashMap.create()
              });
            }
            return target[rootKey];
          }
          __name(GetOrCreateWeakMapTable, "GetOrCreateWeakMapTable");
          function FillRandomBytes(buffer, size) {
            for (var i = 0; i < size; ++i) buffer[i] = Math.random() * 255 | 0;
            return buffer;
          }
          __name(FillRandomBytes, "FillRandomBytes");
          function GenRandomBytes(size) {
            if (typeof Uint8Array === "function") {
              var array = new Uint8Array(size);
              if (typeof crypto !== "undefined") {
                crypto.getRandomValues(array);
              } else if (typeof msCrypto !== "undefined") {
                msCrypto.getRandomValues(array);
              } else {
                FillRandomBytes(array, size);
              }
              return array;
            }
            return FillRandomBytes(new Array(size), size);
          }
          __name(GenRandomBytes, "GenRandomBytes");
          function CreateUUID() {
            var data = GenRandomBytes(UUID_SIZE);
            data[6] = data[6] & 79 | 64;
            data[8] = data[8] & 191 | 128;
            var result = "";
            for (var offset = 0; offset < UUID_SIZE; ++offset) {
              var byte = data[offset];
              if (offset === 4 || offset === 6 || offset === 8) result += "-";
              if (byte < 16) result += "0";
              result += byte.toString(16).toLowerCase();
            }
            return result;
          }
          __name(CreateUUID, "CreateUUID");
        }
        __name(CreateWeakMapPolyfill, "CreateWeakMapPolyfill");
        function MakeDictionary(obj) {
          obj.__ = void 0;
          delete obj.__;
          return obj;
        }
        __name(MakeDictionary, "MakeDictionary");
      });
    })(Reflect2 || (Reflect2 = {}));
  }
});

// src/server/index.ts
import "dotenv/config";
import express from "express";
import { remultExpress } from "remult/remult-express";
import { remult as remult4 } from "remult";
import bcrypt2 from "bcrypt";
import { EntityRegistry as EntityRegistry2, ModuleRegistry, ServiceRegistry as ServiceRegistry3, SERVICE_KEYS as SERVICE_KEYS3 } from "@iraf/core";

// ../modules/system/dist/index.js
var import_reflect_metadata = __toESM(require_Reflect(), 1);
import { iEntity, iField, BaseObject } from "@iraf/core";
import { remult } from "remult";
import { iController, iAction, ServiceRegistry, SERVICE_KEYS } from "@iraf/core";
import { defineModule } from "@iraf/core";
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", {
  value,
  configurable: true
}), "__name");
function _ts_decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
__name(_ts_decorate, "_ts_decorate");
__name2(_ts_decorate, "_ts_decorate");
function _ts_metadata(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
__name(_ts_metadata, "_ts_metadata");
__name2(_ts_metadata, "_ts_metadata");
var AppUser = class extends BaseObject {
  static {
    __name(this, "AppUser");
  }
  static {
    __name2(this, "AppUser");
  }
  username = "";
  passwordHash = "";
  displayName = "";
  isActive = true;
  roles = [];
};
_ts_decorate([
  iField.string({
    caption: "Username",
    required: true,
    order: 1
  })
], AppUser.prototype, "username", void 0);
_ts_decorate([
  iField.string({
    caption: "Password Hash",
    hidden: true,
    readOnly: true
  })
], AppUser.prototype, "passwordHash", void 0);
_ts_decorate([
  iField.string({
    caption: "Display Name",
    order: 2
  })
], AppUser.prototype, "displayName", void 0);
_ts_decorate([
  iField.boolean({
    caption: "Active",
    order: 3
  })
], AppUser.prototype, "isActive", void 0);
_ts_decorate([
  iField.json({
    caption: "Roles",
    control: "roles",
    order: 4,
    writeRoles: [
      "admins"
    ]
  }),
  _ts_metadata("design:type", Array)
], AppUser.prototype, "roles", void 0);
AppUser = _ts_decorate([
  iEntity("users", {
    caption: "Users",
    icon: "User",
    allowApiCrud: [
      "admins"
    ],
    allowedRoles: {
      read: [
        "admins",
        "users"
      ],
      create: [
        "admins"
      ],
      update: /* @__PURE__ */ __name2((user, row) => user?.roles?.includes("admins") || user?.id === row?.id, "update"),
      delete: [
        "admins"
      ]
    }
  })
], AppUser);
function _ts_decorate2(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
__name(_ts_decorate2, "_ts_decorate2");
__name2(_ts_decorate2, "_ts_decorate");
function _ts_metadata2(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
__name(_ts_metadata2, "_ts_metadata2");
__name2(_ts_metadata2, "_ts_metadata");
var UserController = class {
  static {
    __name(this, "UserController");
  }
  static {
    __name2(this, "UserController");
  }
  /**
  * Reset user password (admins only).
  */
  static async resetPassword(id, newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error("ERR_PASSWORD_TOO_SHORT");
    }
    const hasher = ServiceRegistry.require(SERVICE_KEYS.PASSWORD_HASHER);
    const repo = remult.repo(AppUser);
    const user = await repo.findId(id);
    if (!user) throw new Error("ERR_USER_NOT_FOUND");
    const passwordHash = await hasher.hash(newPassword);
    await repo.save({
      ...user,
      passwordHash
    });
  }
  /**
  * Toggle user active status (admins only).
  */
  static async toggleActive(id) {
    const repo = remult.repo(AppUser);
    const user = await repo.findId(id);
    if (!user) throw new Error("ERR_USER_NOT_FOUND");
    await repo.save({
      ...user,
      isActive: !user.isActive
    });
  }
};
_ts_decorate2([
  iAction({
    caption: "Reset Password",
    icon: "KeyRound",
    allowedRoles: [
      "admins"
    ]
  }),
  _ts_metadata2("design:type", Function),
  _ts_metadata2("design:paramtypes", [
    String,
    String
  ]),
  _ts_metadata2("design:returntype", Promise)
], UserController, "resetPassword", null);
_ts_decorate2([
  iAction({
    caption: "Toggle Active",
    icon: "Power",
    allowedRoles: [
      "admins"
    ]
  }),
  _ts_metadata2("design:type", Function),
  _ts_metadata2("design:paramtypes", [
    String
  ]),
  _ts_metadata2("design:returntype", Promise)
], UserController, "toggleActive", null);
UserController = _ts_decorate2([
  iController(AppUser)
], UserController);
var SystemModule = defineModule({
  key: "system",
  caption: "System",
  icon: "Settings",
  entities: [
    AppUser
  ],
  controllers: [
    UserController
  ],
  allowedRoles: [
    "admins"
  ],
  i18n: {
    "zh-TW": {
      "System": "\u7CFB\u7D71\u7BA1\u7406",
      "Users": "\u4F7F\u7528\u8005",
      "Username": "\u5E33\u865F",
      "Password Hash": "\u5BC6\u78BC\u96DC\u6E4A",
      "Display Name": "\u986F\u793A\u540D\u7A31",
      "Active": "\u555F\u7528",
      "Roles": "\u89D2\u8272",
      "Reset Password": "\u91CD\u8A2D\u5BC6\u78BC",
      "Toggle Active": "\u5207\u63DB\u555F\u7528\u72C0\u614B"
    }
  }
});

// src/server/auth.ts
import { Router } from "express";
import { remult as remult2 } from "remult";
import { ServiceRegistry as ServiceRegistry2, SERVICE_KEYS as SERVICE_KEYS2 } from "@iraf/core";
var JWT_SECRET = process.env.IRAF_JWT_SECRET ?? "iraf-dev-secret-change-in-production";
async function getUser(req) {
  const provider = ServiceRegistry2.resolve(SERVICE_KEYS2.AUTH);
  if (!provider) return void 0;
  return provider.getUser(req);
}
__name(getUser, "getUser");
function createAuthRouter(withRemult) {
  const router = Router();
  router.post("/api/auth/login", withRemult, async (req, res) => {
    try {
      const provider = ServiceRegistry2.require(SERVICE_KEYS2.AUTH);
      const result = await provider.login(req.body);
      res.json(result);
    } catch (e) {
      const message = e?.message ?? "ERR_AUTH_FAILED";
      const code = typeof message === "string" && message.startsWith("ERR_") ? message : "ERR_AUTH_FAILED";
      const status = code === "ERR_AUTH_DISABLED" ? 403 : 401;
      res.status(status).json({
        code,
        message: code
      });
    }
  });
  router.get("/api/auth/me", withRemult, (_req, res) => {
    if (!remult2.user) {
      res.status(401).json({
        code: "ERR_AUTH_UNAUTHENTICATED",
        message: "ERR_AUTH_UNAUTHENTICATED"
      });
      return;
    }
    res.json({
      user: remult2.user
    });
  });
  return router;
}
__name(createAuthRouter, "createAuthRouter");

// src/server/JwtAuthProvider.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { remult as remult3 } from "remult";
var JwtAuthProvider = class {
  static {
    __name(this, "JwtAuthProvider");
  }
  secret;
  expiresIn;
  constructor({ secret, expiresIn = "8h" }) {
    this.secret = secret;
    this.expiresIn = expiresIn;
  }
  signToken(user) {
    return jwt.sign({
      id: user.id,
      name: user.displayName || user.username,
      roles: user.roles
    }, this.secret, {
      expiresIn: this.expiresIn
    });
  }
  async login(credentials) {
    const { username, password } = credentials;
    if (!username || !password) throw new Error("ERR_AUTH_REQUIRED");
    const repo = remult3.repo(AppUser);
    const user = await repo.findFirst({
      username
    });
    if (!user) throw new Error("ERR_AUTH_INVALID_CREDENTIALS");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error("ERR_AUTH_INVALID_CREDENTIALS");
    if (user.isActive === false) throw new Error("ERR_AUTH_DISABLED");
    const token = this.signToken(user);
    return {
      token,
      user: {
        id: user.id,
        name: user.displayName || user.username,
        roles: user.roles
      }
    };
  }
  async getUser(req) {
    const authHeader = req.headers["authorization"];
    if (!authHeader || typeof authHeader !== "string") return void 0;
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    try {
      const payload = jwt.verify(token, this.secret);
      return {
        id: payload.id,
        name: payload.name,
        roles: payload.roles
      };
    } catch {
      return void 0;
    }
  }
};

// src/server/metaRouter.ts
import { Router as Router2 } from "express";
import { EntityRegistry } from "@iraf/core";
function serializeField(name, fm) {
  return {
    name,
    caption: fm.caption ?? name,
    type: fm._type ?? "string",
    required: fm.required ?? false,
    hidden: typeof fm.hidden === "boolean" ? fm.hidden : false,
    readOnly: typeof fm.readOnly === "boolean" ? fm.readOnly : false,
    ...fm.group ? {
      group: fm.group
    } : {},
    ...fm.order !== void 0 ? {
      order: fm.order
    } : {},
    ...fm.options ? {
      options: fm.options
    } : {},
    ...fm.ref ? {
      ref: fm.ref,
      refLabel: fm.refLabel
    } : {},
    ...fm.collection ? {
      collection: {
        foreignKey: fm.collection.foreignKey
      }
    } : {},
    ...fm.auditField ? {
      auditField: true
    } : {}
  };
}
__name(serializeField, "serializeField");
function createMetaRouter() {
  const router = Router2();
  router.get("/api/iraf/meta/entities", (_req, res) => {
    const list = EntityRegistry.getAllWithMeta().map(({ entityClass, meta }) => {
      const fields = EntityRegistry.getFieldMeta(entityClass);
      const actions = EntityRegistry.getActions(entityClass).map(({ controllerClass, meta: am }) => ({
        controllerClass: controllerClass.name,
        methodName: am.methodName,
        caption: am.caption
      }));
      return {
        key: meta.key,
        caption: meta.caption,
        icon: meta.icon,
        fields: Object.entries(fields).sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999)).map(([name, fm]) => serializeField(name, fm)),
        ...actions.length > 0 ? {
          actions
        } : {}
      };
    });
    res.json(list);
  });
  router.get("/api/iraf/meta/entities/:key", (req, res) => {
    const entry = EntityRegistry.getAllWithMeta().find((e) => e.meta.key === req.params.key);
    if (!entry) {
      res.status(404).json({
        error: `Entity '${req.params.key}' not found`
      });
      return;
    }
    const { entityClass, meta } = entry;
    const fields = EntityRegistry.getFieldMeta(entityClass);
    const actions = EntityRegistry.getActions(entityClass).map(({ controllerClass, meta: am }) => ({
      controllerClass: controllerClass.name,
      methodName: am.methodName,
      caption: am.caption,
      icon: am.icon,
      allowedRoles: am.allowedRoles
    }));
    res.json({
      key: meta.key,
      caption: meta.caption,
      icon: meta.icon,
      defaultOrder: meta.defaultOrder,
      fields: Object.entries(fields).sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999)).map(([name, fm]) => serializeField(name, fm)),
      actions
    });
  });
  return router;
}
__name(createMetaRouter, "createMetaRouter");

// src/modules/index.ts
import { SampleModule } from "@iraf/module-sample";

// ../modules/product/dist/index.js
import { defineModule as defineModule2 } from "@iraf/core";
import { BaseObject as BaseObject2, iEntity as iEntity2, iField as iField2, iController as iController2, iAction as iAction2 } from "@iraf/core";
import { BaseObject as BaseObject22, iEntity as iEntity22, iField as iField22, iController as iController22, iAction as iAction22 } from "@iraf/core";
var __defProp3 = Object.defineProperty;
var __name3 = /* @__PURE__ */ __name((target, value) => __defProp3(target, "name", {
  value,
  configurable: true
}), "__name");
function _ts_decorate3(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
__name(_ts_decorate3, "_ts_decorate");
__name3(_ts_decorate3, "_ts_decorate");
function _ts_metadata3(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
__name(_ts_metadata3, "_ts_metadata");
__name3(_ts_metadata3, "_ts_metadata");
var ProductCategory = class extends BaseObject2 {
  static {
    __name(this, "ProductCategory");
  }
  static {
    __name3(this, "ProductCategory");
  }
  name = "";
  code = "";
  parentCategoryId = "";
  description = "";
  imageUrl = "";
  sortOrder = 0;
  isActive = true;
  seoTitle = "";
  seoDescription = "";
  seoKeywords = "";
};
_ts_decorate3([
  iField2.string({
    caption: "\u5206\u985E\u540D\u7A31",
    required: true,
    order: 1,
    group: "\u57FA\u672C\u8CC7\u8A0A"
  }),
  _ts_metadata3("design:type", String)
], ProductCategory.prototype, "name", void 0);
_ts_decorate3([
  iField2.string({
    caption: "\u5206\u985E\u4EE3\u78BC",
    required: true,
    order: 2,
    group: "\u57FA\u672C\u8CC7\u8A0A",
    validate: /* @__PURE__ */ __name3((val) => /^[A-Z0-9_]+$/.test(val) || "\u4EE3\u78BC\u53EA\u80FD\u5305\u542B\u5927\u5BEB\u5B57\u6BCD\u3001\u6578\u5B57\u548C\u5E95\u7DDA", "validate")
  }),
  _ts_metadata3("design:type", String)
], ProductCategory.prototype, "code", void 0);
_ts_decorate3([
  iField2.string({
    caption: "\u4E0A\u5C64\u5206\u985E",
    order: 3,
    group: "\u57FA\u672C\u8CC7\u8A0A",
    control: "ref",
    refEntity: "product-category"
  }),
  _ts_metadata3("design:type", String)
], ProductCategory.prototype, "parentCategoryId", void 0);
_ts_decorate3([
  iField2.string({
    caption: "\u5206\u985E\u63CF\u8FF0",
    order: 4,
    group: "\u57FA\u672C\u8CC7\u8A0A",
    control: "textarea"
  }),
  _ts_metadata3("design:type", String)
], ProductCategory.prototype, "description", void 0);
_ts_decorate3([
  iField2.string({
    caption: "\u5C01\u9762\u5716\u7247 URL",
    order: 5,
    group: "\u57FA\u672C\u8CC7\u8A0A"
  }),
  _ts_metadata3("design:type", String)
], ProductCategory.prototype, "imageUrl", void 0);
_ts_decorate3([
  iField2.number({
    caption: "\u6392\u5217\u9806\u5E8F",
    order: 6,
    group: "\u57FA\u672C\u8CC7\u8A0A",
    defaultValue: 0
  }),
  _ts_metadata3("design:type", Number)
], ProductCategory.prototype, "sortOrder", void 0);
_ts_decorate3([
  iField2.boolean({
    caption: "\u555F\u7528",
    order: 7,
    group: "\u57FA\u672C\u8CC7\u8A0A",
    defaultValue: true
  }),
  _ts_metadata3("design:type", Boolean)
], ProductCategory.prototype, "isActive", void 0);
_ts_decorate3([
  iField2.string({
    caption: "SEO \u6A19\u984C",
    order: 1,
    group: "SEO"
  }),
  _ts_metadata3("design:type", String)
], ProductCategory.prototype, "seoTitle", void 0);
_ts_decorate3([
  iField2.string({
    caption: "SEO \u63CF\u8FF0",
    order: 2,
    group: "SEO",
    control: "textarea"
  }),
  _ts_metadata3("design:type", String)
], ProductCategory.prototype, "seoDescription", void 0);
_ts_decorate3([
  iField2.string({
    caption: "SEO \u95DC\u9375\u5B57",
    order: 3,
    group: "SEO"
  }),
  _ts_metadata3("design:type", String)
], ProductCategory.prototype, "seoKeywords", void 0);
ProductCategory = _ts_decorate3([
  iEntity2("product-category", {
    caption: "\u7522\u54C1\u5206\u985E",
    icon: "tag",
    allowedRoles: [
      "admin",
      "manager",
      "staff"
    ]
  })
], ProductCategory);
var ProductCategoryController = class ProductCategoryController2 {
  static {
    __name(this, "ProductCategoryController2");
  }
  static {
    __name3(this, "ProductCategoryController");
  }
  async deactivate(record) {
    record.isActive = false;
    return record;
  }
  async activate(record) {
    record.isActive = true;
    return record;
  }
};
_ts_decorate3([
  iAction2({
    caption: "\u505C\u7528\u5206\u985E",
    allowedRoles: [
      "admin",
      "manager"
    ],
    confirm: "\u78BA\u5B9A\u8981\u505C\u7528\u6B64\u5206\u985E\u55CE\uFF1F"
  }),
  _ts_metadata3("design:type", Function),
  _ts_metadata3("design:paramtypes", [
    typeof ProductCategory === "undefined" ? Object : ProductCategory
  ]),
  _ts_metadata3("design:returntype", Promise)
], ProductCategoryController.prototype, "deactivate", null);
_ts_decorate3([
  iAction2({
    caption: "\u555F\u7528\u5206\u985E",
    allowedRoles: [
      "admin",
      "manager"
    ]
  }),
  _ts_metadata3("design:type", Function),
  _ts_metadata3("design:paramtypes", [
    typeof ProductCategory === "undefined" ? Object : ProductCategory
  ]),
  _ts_metadata3("design:returntype", Promise)
], ProductCategoryController.prototype, "activate", null);
ProductCategoryController = _ts_decorate3([
  iController2(ProductCategory)
], ProductCategoryController);
function _ts_decorate22(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
__name(_ts_decorate22, "_ts_decorate2");
__name3(_ts_decorate22, "_ts_decorate");
function _ts_metadata22(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
__name(_ts_metadata22, "_ts_metadata2");
__name3(_ts_metadata22, "_ts_metadata");
var Product = class extends BaseObject22 {
  static {
    __name(this, "Product");
  }
  static {
    __name3(this, "Product");
  }
  // ── 基本資訊 ──────────────────────────────────────
  name = "";
  sku = "";
  barcode = "";
  categoryId = "";
  brand = "";
  status = "draft";
  shortDescription = "";
  description = "";
  // ── 價格 ──────────────────────────────────────────
  price = 0;
  originalPrice = 0;
  costPrice = 0;
  currency = "TWD";
  taxRate = 5;
  // ── 庫存 ──────────────────────────────────────────
  stockQuantity = 0;
  safetyStock = 0;
  minimumOrderQuantity = 1;
  stockUnit = "pcs";
  trackInventory = true;
  allowBackorder = false;
  // ── 規格 ──────────────────────────────────────────
  weight = 0;
  length = 0;
  width = 0;
  height = 0;
  material = "";
  color = "";
  size = "";
  customAttributes = {};
  // ── 媒體 ──────────────────────────────────────────
  mainImageUrl = "";
  imageGallery = [];
  videoUrl = "";
  // ── SEO ───────────────────────────────────────────
  seoTitle = "";
  seoDescription = "";
  seoKeywords = "";
  slug = "";
  // ── 其他 ──────────────────────────────────────────
  isFeatured = false;
  isNew = false;
  publishedAt = null;
  unpublishedAt = null;
  supplier = "";
  origin = "";
  warrantyPeriod = "";
  notes = "";
};
_ts_decorate22([
  iField22.string({
    caption: "\u7522\u54C1\u540D\u7A31",
    required: true,
    order: 1,
    group: "\u57FA\u672C\u8CC7\u8A0A"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "name", void 0);
_ts_decorate22([
  iField22.string({
    caption: "\u7522\u54C1\u7DE8\u865F (SKU)",
    required: true,
    order: 2,
    group: "\u57FA\u672C\u8CC7\u8A0A",
    validate: /* @__PURE__ */ __name3((val) => val.length >= 3 || "SKU \u81F3\u5C11\u9700\u8981 3 \u500B\u5B57\u5143", "validate")
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "sku", void 0);
_ts_decorate22([
  iField22.string({
    caption: "\u689D\u78BC (Barcode)",
    order: 3,
    group: "\u57FA\u672C\u8CC7\u8A0A"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "barcode", void 0);
_ts_decorate22([
  iField22.string({
    caption: "\u7522\u54C1\u5206\u985E",
    required: true,
    order: 4,
    group: "\u57FA\u672C\u8CC7\u8A0A",
    control: "ref",
    refEntity: "product-category"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "categoryId", void 0);
_ts_decorate22([
  iField22.string({
    caption: "\u54C1\u724C",
    order: 5,
    group: "\u57FA\u672C\u8CC7\u8A0A"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "brand", void 0);
_ts_decorate22([
  iField22.string({
    caption: "\u7522\u54C1\u72C0\u614B",
    order: 6,
    group: "\u57FA\u672C\u8CC7\u8A0A",
    control: "options",
    options: [
      {
        label: "\u8349\u7A3F",
        value: "draft"
      },
      {
        label: "\u4E0A\u67B6\u4E2D",
        value: "active"
      },
      {
        label: "\u5DF2\u4E0B\u67B6",
        value: "inactive"
      },
      {
        label: "\u7F3A\u8CA8",
        value: "out_of_stock"
      },
      {
        label: "\u505C\u7522",
        value: "discontinued"
      }
    ],
    defaultValue: "draft"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "status", void 0);
_ts_decorate22([
  iField22.string({
    caption: "\u7C21\u77ED\u63CF\u8FF0",
    order: 7,
    group: "\u57FA\u672C\u8CC7\u8A0A",
    control: "textarea"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "shortDescription", void 0);
_ts_decorate22([
  iField22.string({
    caption: "\u8A73\u7D30\u63CF\u8FF0",
    order: 8,
    group: "\u57FA\u672C\u8CC7\u8A0A",
    control: "textarea"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "description", void 0);
_ts_decorate22([
  iField22.number({
    caption: "\u552E\u50F9",
    required: true,
    order: 1,
    group: "\u50F9\u683C",
    validate: /* @__PURE__ */ __name3((val) => val >= 0 || "\u552E\u50F9\u4E0D\u80FD\u70BA\u8CA0\u6578", "validate")
  }),
  _ts_metadata22("design:type", Number)
], Product.prototype, "price", void 0);
_ts_decorate22([
  iField22.number({
    caption: "\u539F\u50F9 / \u5E02\u5834\u50F9",
    order: 2,
    group: "\u50F9\u683C"
  }),
  _ts_metadata22("design:type", Number)
], Product.prototype, "originalPrice", void 0);
_ts_decorate22([
  iField22.number({
    caption: "\u6210\u672C\u50F9",
    order: 3,
    group: "\u50F9\u683C",
    writeRoles: [
      "admin",
      "manager"
    ]
  }),
  _ts_metadata22("design:type", Number)
], Product.prototype, "costPrice", void 0);
_ts_decorate22([
  iField22.string({
    caption: "\u5E63\u5225",
    order: 4,
    group: "\u50F9\u683C",
    control: "options",
    options: [
      {
        label: "\u65B0\u53F0\u5E63 (TWD)",
        value: "TWD"
      },
      {
        label: "\u7F8E\u5143 (USD)",
        value: "USD"
      },
      {
        label: "\u65E5\u5713 (JPY)",
        value: "JPY"
      },
      {
        label: "\u4EBA\u6C11\u5E63 (CNY)",
        value: "CNY"
      }
    ],
    defaultValue: "TWD"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "currency", void 0);
_ts_decorate22([
  iField22.number({
    caption: "\u7A05\u7387 (%)",
    order: 5,
    group: "\u50F9\u683C",
    defaultValue: 5
  }),
  _ts_metadata22("design:type", Number)
], Product.prototype, "taxRate", void 0);
_ts_decorate22([
  iField22.number({
    caption: "\u5EAB\u5B58\u6578\u91CF",
    order: 1,
    group: "\u5EAB\u5B58",
    defaultValue: 0
  }),
  _ts_metadata22("design:type", Number)
], Product.prototype, "stockQuantity", void 0);
_ts_decorate22([
  iField22.number({
    caption: "\u5B89\u5168\u5EAB\u5B58\u91CF",
    order: 2,
    group: "\u5EAB\u5B58",
    defaultValue: 0
  }),
  _ts_metadata22("design:type", Number)
], Product.prototype, "safetyStock", void 0);
_ts_decorate22([
  iField22.number({
    caption: "\u6700\u4F4E\u8A02\u8CFC\u91CF (MOQ)",
    order: 3,
    group: "\u5EAB\u5B58",
    defaultValue: 1
  }),
  _ts_metadata22("design:type", Number)
], Product.prototype, "minimumOrderQuantity", void 0);
_ts_decorate22([
  iField22.string({
    caption: "\u5EAB\u5B58\u55AE\u4F4D",
    order: 4,
    group: "\u5EAB\u5B58",
    control: "options",
    options: [
      {
        label: "\u500B",
        value: "pcs"
      },
      {
        label: "\u7BB1",
        value: "box"
      },
      {
        label: "\u516C\u65A4",
        value: "kg"
      },
      {
        label: "\u516C\u5347",
        value: "liter"
      },
      {
        label: "\u516C\u5C3A",
        value: "meter"
      }
    ],
    defaultValue: "pcs"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "stockUnit", void 0);
_ts_decorate22([
  iField22.boolean({
    caption: "\u8FFD\u8E64\u5EAB\u5B58",
    order: 5,
    group: "\u5EAB\u5B58",
    defaultValue: true
  }),
  _ts_metadata22("design:type", Boolean)
], Product.prototype, "trackInventory", void 0);
_ts_decorate22([
  iField22.boolean({
    caption: "\u5141\u8A31\u8CA0\u5EAB\u5B58",
    order: 6,
    group: "\u5EAB\u5B58",
    defaultValue: false
  }),
  _ts_metadata22("design:type", Boolean)
], Product.prototype, "allowBackorder", void 0);
_ts_decorate22([
  iField22.number({
    caption: "\u91CD\u91CF (kg)",
    order: 1,
    group: "\u898F\u683C"
  }),
  _ts_metadata22("design:type", Number)
], Product.prototype, "weight", void 0);
_ts_decorate22([
  iField22.number({
    caption: "\u9577\u5EA6 (cm)",
    order: 2,
    group: "\u898F\u683C"
  }),
  _ts_metadata22("design:type", Number)
], Product.prototype, "length", void 0);
_ts_decorate22([
  iField22.number({
    caption: "\u5BEC\u5EA6 (cm)",
    order: 3,
    group: "\u898F\u683C"
  }),
  _ts_metadata22("design:type", Number)
], Product.prototype, "width", void 0);
_ts_decorate22([
  iField22.number({
    caption: "\u9AD8\u5EA6 (cm)",
    order: 4,
    group: "\u898F\u683C"
  }),
  _ts_metadata22("design:type", Number)
], Product.prototype, "height", void 0);
_ts_decorate22([
  iField22.string({
    caption: "\u6750\u8CEA",
    order: 5,
    group: "\u898F\u683C"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "material", void 0);
_ts_decorate22([
  iField22.string({
    caption: "\u984F\u8272",
    order: 6,
    group: "\u898F\u683C"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "color", void 0);
_ts_decorate22([
  iField22.string({
    caption: "\u5C3A\u5BF8",
    order: 7,
    group: "\u898F\u683C"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "size", void 0);
_ts_decorate22([
  iField22.json({
    caption: "\u81EA\u8A02\u898F\u683C\u5C6C\u6027",
    order: 8,
    group: "\u898F\u683C"
  }),
  _ts_metadata22("design:type", typeof Record === "undefined" ? Object : Record)
], Product.prototype, "customAttributes", void 0);
_ts_decorate22([
  iField22.string({
    caption: "\u4E3B\u5716 URL",
    order: 1,
    group: "\u5A92\u9AD4"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "mainImageUrl", void 0);
_ts_decorate22([
  iField22.json({
    caption: "\u5716\u7247\u96C6",
    order: 2,
    group: "\u5A92\u9AD4"
  }),
  _ts_metadata22("design:type", Array)
], Product.prototype, "imageGallery", void 0);
_ts_decorate22([
  iField22.string({
    caption: "\u5F71\u7247 URL",
    order: 3,
    group: "\u5A92\u9AD4"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "videoUrl", void 0);
_ts_decorate22([
  iField22.string({
    caption: "SEO \u6A19\u984C",
    order: 1,
    group: "SEO"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "seoTitle", void 0);
_ts_decorate22([
  iField22.string({
    caption: "SEO \u63CF\u8FF0",
    order: 2,
    group: "SEO",
    control: "textarea"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "seoDescription", void 0);
_ts_decorate22([
  iField22.string({
    caption: "SEO \u95DC\u9375\u5B57",
    order: 3,
    group: "SEO"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "seoKeywords", void 0);
_ts_decorate22([
  iField22.string({
    caption: "\u7DB2\u5740 Slug",
    order: 4,
    group: "SEO",
    validate: /* @__PURE__ */ __name3((val) => !val || /^[a-z0-9-]+$/.test(val) || "Slug \u53EA\u80FD\u5305\u542B\u5C0F\u5BEB\u5B57\u6BCD\u3001\u6578\u5B57\u548C\u9023\u5B57\u865F", "validate")
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "slug", void 0);
_ts_decorate22([
  iField22.boolean({
    caption: "\u7CBE\u9078\u7522\u54C1",
    order: 1,
    group: "\u5176\u4ED6",
    defaultValue: false
  }),
  _ts_metadata22("design:type", Boolean)
], Product.prototype, "isFeatured", void 0);
_ts_decorate22([
  iField22.boolean({
    caption: "\u65B0\u54C1",
    order: 2,
    group: "\u5176\u4ED6",
    defaultValue: false
  }),
  _ts_metadata22("design:type", Boolean)
], Product.prototype, "isNew", void 0);
_ts_decorate22([
  iField22.date({
    caption: "\u4E0A\u67B6\u65E5\u671F",
    order: 3,
    group: "\u5176\u4ED6"
  }),
  _ts_metadata22("design:type", Object)
], Product.prototype, "publishedAt", void 0);
_ts_decorate22([
  iField22.date({
    caption: "\u4E0B\u67B6\u65E5\u671F",
    order: 4,
    group: "\u5176\u4ED6"
  }),
  _ts_metadata22("design:type", Object)
], Product.prototype, "unpublishedAt", void 0);
_ts_decorate22([
  iField22.string({
    caption: "\u4F9B\u61C9\u5546",
    order: 5,
    group: "\u5176\u4ED6"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "supplier", void 0);
_ts_decorate22([
  iField22.string({
    caption: "\u7522\u5730",
    order: 6,
    group: "\u5176\u4ED6"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "origin", void 0);
_ts_decorate22([
  iField22.string({
    caption: "\u4FDD\u56FA\u671F",
    order: 7,
    group: "\u5176\u4ED6"
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "warrantyPeriod", void 0);
_ts_decorate22([
  iField22.string({
    caption: "\u5099\u8A3B",
    order: 8,
    group: "\u5176\u4ED6",
    control: "textarea",
    writeRoles: [
      "admin",
      "manager"
    ]
  }),
  _ts_metadata22("design:type", String)
], Product.prototype, "notes", void 0);
Product = _ts_decorate22([
  iEntity22("product", {
    caption: "\u7522\u54C1",
    icon: "box",
    allowedRoles: [
      "admin",
      "manager",
      "staff"
    ]
  })
], Product);
var ProductController = class ProductController2 {
  static {
    __name(this, "ProductController2");
  }
  static {
    __name3(this, "ProductController");
  }
  async publish(record) {
    record.status = "active";
    record.publishedAt = /* @__PURE__ */ new Date();
    return record;
  }
  async unpublish(record) {
    record.status = "inactive";
    record.unpublishedAt = /* @__PURE__ */ new Date();
    return record;
  }
  async markFeatured(record) {
    record.isFeatured = true;
    return record;
  }
  async markOutOfStock(record) {
    record.status = "out_of_stock";
    record.stockQuantity = 0;
    return record;
  }
};
_ts_decorate22([
  iAction22({
    caption: "\u4E0A\u67B6\u7522\u54C1",
    allowedRoles: [
      "admin",
      "manager"
    ],
    confirm: "\u78BA\u5B9A\u8981\u4E0A\u67B6\u6B64\u7522\u54C1\u55CE\uFF1F"
  }),
  _ts_metadata22("design:type", Function),
  _ts_metadata22("design:paramtypes", [
    typeof Product === "undefined" ? Object : Product
  ]),
  _ts_metadata22("design:returntype", Promise)
], ProductController.prototype, "publish", null);
_ts_decorate22([
  iAction22({
    caption: "\u4E0B\u67B6\u7522\u54C1",
    allowedRoles: [
      "admin",
      "manager"
    ],
    confirm: "\u78BA\u5B9A\u8981\u4E0B\u67B6\u6B64\u7522\u54C1\u55CE\uFF1F"
  }),
  _ts_metadata22("design:type", Function),
  _ts_metadata22("design:paramtypes", [
    typeof Product === "undefined" ? Object : Product
  ]),
  _ts_metadata22("design:returntype", Promise)
], ProductController.prototype, "unpublish", null);
_ts_decorate22([
  iAction22({
    caption: "\u6A19\u8A18\u70BA\u7CBE\u9078",
    allowedRoles: [
      "admin",
      "manager"
    ]
  }),
  _ts_metadata22("design:type", Function),
  _ts_metadata22("design:paramtypes", [
    typeof Product === "undefined" ? Object : Product
  ]),
  _ts_metadata22("design:returntype", Promise)
], ProductController.prototype, "markFeatured", null);
_ts_decorate22([
  iAction22({
    caption: "\u6A19\u8A18\u7F3A\u8CA8",
    allowedRoles: [
      "admin",
      "manager"
    ],
    confirm: "\u78BA\u5B9A\u8981\u5C07\u6B64\u7522\u54C1\u6A19\u8A18\u70BA\u7F3A\u8CA8\u55CE\uFF1F"
  }),
  _ts_metadata22("design:type", Function),
  _ts_metadata22("design:paramtypes", [
    typeof Product === "undefined" ? Object : Product
  ]),
  _ts_metadata22("design:returntype", Promise)
], ProductController.prototype, "markOutOfStock", null);
ProductController = _ts_decorate22([
  iController22(Product)
], ProductController);
var ProductModule = defineModule2({
  key: "product",
  caption: "Product",
  icon: "Package",
  description: "Product management module including categories and products",
  entities: [
    Product,
    ProductCategory
  ],
  menu: [
    {
      type: "entity",
      entity: Product,
      caption: "Products"
    },
    {
      type: "entity",
      entity: ProductCategory,
      caption: "Categories"
    }
  ]
});

// src/server/index.ts
async function createDataProvider() {
  if (process.env.DATABASE_URL) {
    const { createPostgresDataProvider } = await import("remult/postgres");
    console.log("[iRAF] Using PostgreSQL data provider");
    return createPostgresDataProvider({
      connectionString: process.env.DATABASE_URL
    });
  }
  console.log("[iRAF] Using JSON file data provider (dev)");
  return void 0;
}
__name(createDataProvider, "createDataProvider");
ServiceRegistry3.register(SERVICE_KEYS3.AUTH, new JwtAuthProvider({
  secret: JWT_SECRET
}));
ServiceRegistry3.register(SERVICE_KEYS3.PASSWORD_HASHER, {
  hash: /* @__PURE__ */ __name((password) => bcrypt2.hash(password, 10), "hash"),
  compare: /* @__PURE__ */ __name((password, hash) => bcrypt2.compare(password, hash), "compare")
});
var app = express();
app.use(express.json());
var dataProvider = await createDataProvider();
var api = remultExpress({
  entities: EntityRegistry2.getAll(),
  controllers: EntityRegistry2.getAllControllers(),
  dataProvider,
  getUser,
  initApi: /* @__PURE__ */ __name(async () => {
    const repo = remult4.repo(AppUser);
    const count = await repo.count();
    if (count === 0) {
      const username = process.env.IRAF_ADMIN_USERNAME ?? "admin";
      const password = process.env.IRAF_ADMIN_PASSWORD ?? "admin123";
      const passwordHash = await bcrypt2.hash(password, 10);
      await repo.insert({
        username,
        passwordHash,
        displayName: username,
        roles: [
          "admins"
        ]
      });
      console.log(`[iRAF] Created default admin user: ${username}`);
    }
  }, "initApi")
});
app.use(api);
app.use(createAuthRouter(api.withRemult));
app.use(createMetaRouter());
app.get("/", (_req, res) => {
  res.json({
    status: "iRAF Demo Server running",
    version: "0.1.0"
  });
});
var PORT = 3001;
async function startServer() {
  await ModuleRegistry.serverInitAll();
  app.listen(PORT, () => {
    console.log(`iRAF Demo Server started on http://localhost:${PORT}`);
  });
}
__name(startServer, "startServer");
startServer();
/*! Bundled license information:

reflect-metadata/Reflect.js:
  (*! *****************************************************************************
  Copyright (C) Microsoft. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0
  
  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.
  
  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** *)
*/
//# sourceMappingURL=index.js.map