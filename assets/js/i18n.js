(function () {
  'use strict';

  const locale = document.documentElement.lang || 'ar';
  const messages = window.UI_TRANSLATIONS || {};
  if (locale !== 'en' || !Object.keys(messages).length) return;

  const ignored = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE']);
  const attributes = ['title', 'placeholder', 'aria-label', 'data-confirm'];

  function translated(value) {
    const match = value.match(/^(\s*)(.*?)(\s*)$/s);
    if (!match) return value;
    const text = match[2];
    if (!text || !/[\u0600-\u06ff]/.test(text)) return value;
    if (messages[text]) return match[1] + messages[text] + match[3];

    let output = text;
    Object.keys(messages).sort((a, b) => b.length - a.length).forEach(key => {
      if (key.length >= 3 && output.includes(key)) output = output.split(key).join(messages[key]);
    });
    return match[1] + output + match[3];
  }

  const messageKeys = Object.keys(messages).sort((a, b) => b.length - a.length);
  function translatedMessage(value) {
    const exact = translated(value);
    if (exact !== value) return exact;
    let output = value;
    messageKeys.forEach(key => {
      if (key.length >= 4 && output.includes(key)) output = output.split(key).join(messages[key]);
    });
    return output;
  }

  window.translateUi = translated;
  const nativeConfirm = window.confirm.bind(window);
  const nativeAlert = window.alert.bind(window);
  window.confirm = message => nativeConfirm(translatedMessage(String(message)));
  window.alert = message => nativeAlert(translatedMessage(String(message)));
  if (typeof window.showToast === 'function') {
    const nativeToast = window.showToast.bind(window);
    window.showToast = message => nativeToast(translatedMessage(String(message)));
  }

  function translateElement(element) {
    if (!(element instanceof Element) || element.closest('[data-i18n-ignore]')) return;

    attributes.forEach(attribute => {
      if (element.hasAttribute(attribute)) {
        element.setAttribute(attribute, translated(element.getAttribute(attribute)));
      }
    });

    Array.from(element.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && !ignored.has(element.tagName)) {
        node.nodeValue = translated(node.nodeValue);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        translateElement(node);
      }
    });
  }

  function translatePage(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      const parent = root.parentElement;
      if (parent && !ignored.has(parent.tagName) && !parent.closest('[data-i18n-ignore]')) {
        root.nodeValue = translated(root.nodeValue);
      }
      return;
    }
    translateElement(root);
  }

  translatePage(document.body);
  new MutationObserver(mutations => mutations.forEach(mutation => {
    mutation.addedNodes.forEach(translatePage);
  })).observe(document.body, { childList: true, subtree: true });
})();
