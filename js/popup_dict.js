// ==UserScript==
// @name         Chinese Hover Dictionary (Dynamic)
// @namespace    https://janpaje.dev/
// @version      1.0
// @description  Hover over Chinese text to see pinyin and English definitions.
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  console.log('Chinese Hover Dictionary (Dynamic) script started.');

  const cache = {}; // per-character cache
  const fetched = new Set(); // prevent re-fetching
  const API_BASE = "https://janpaje.dev/dict/split_dict";

  function isChinese(char) {
    return /[\u4e00-\u9fff]/.test(char);
  }

  function getWordUnderCursor(node, offset) {
    const text = node.textContent;
    let start = offset;
    let end = offset;

    while (start > 0 && isChinese(text[start - 1])) start--;
    while (end < text.length && isChinese(text[end])) end++;

    const word = text.slice(start, end);
    console.log('Word under cursor:', word);
    return word;
  }

  function createTooltip() {
    const tip = document.createElement('div');
    Object.assign(tip.style, {
      position: 'absolute',
      background: 'rgba(255, 255, 255, 0.98)',
      border: '1px solid #ccc',
      padding: '6px 10px',
      fontSize: '14px',
      fontFamily: 'sans-serif',
      borderRadius: '6px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
      zIndex: 9999,
      display: 'none',
      lineHeight: '1.5',
      maxWidth: '300px'
    });
    document.body.appendChild(tip);
    console.log('Tooltip created.');
    return tip;
  }

  const tooltip = createTooltip();

  async function lookupWord(word) {
    if (!word || !isChinese(word[0])) {
      console.log('Not a Chinese word or empty:', word);
      return null;
    }

    const firstChar = word[0];
    console.log('Looking up word:', word, 'First char:', firstChar);

    if (!cache[firstChar] && !fetched.has(firstChar)) {
      console.log('Fetching data for char:', firstChar);
      try {
        // Create the proper URL encoding for the character
        const encodedChar = encodeURIComponent(firstChar);
        console.log('Encoded character:', encodedChar);

        // Construct the URL with the encoded character
        const url = `${API_BASE}/${encodedChar}.json`;
        console.log('Fetching URL:', url);

        const res = await fetch(url);
        console.log('Fetch response status:', res.status);

        if (res.ok) {
          const data = await res.json();
          cache[firstChar] = data;
          console.log('Data fetched and cached for char:', firstChar, data);
        } else {
          cache[firstChar] = {}; // prevent retry loop
          console.warn('Failed to fetch data for char:', firstChar, 'HTTP status:', res.status);
        }
      } catch (err) {
        cache[firstChar] = {};
        console.error('Error fetching data for char:', firstChar, err);
      }
      fetched.add(firstChar);
    } else {
      console.log('Data already fetched for char:', firstChar);
    }

    const result = cache[firstChar]?.[word] ?? null;
    console.log('Lookup result for word:', word, result);
    return result;
  }

  let debounceTimer = null;

  document.addEventListener('mousemove', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const range = document.caretRangeFromPoint(e.clientX, e.clientY);
      if (!range || !range.startContainer || range.startContainer.nodeType !== Node.TEXT_NODE) {
        tooltip.style.display = 'none';
        console.log('Not a text node, hiding tooltip.');
        return;
      }

      const word = getWordUnderCursor(range.startContainer, range.startOffset);
      const entry = await lookupWord(word);

      if (entry) {
        tooltip.innerHTML = `<strong>${word}</strong><br><em>${entry.pinyin}</em><br>${entry.definition}`;
        tooltip.style.left = `${e.pageX + 12}px`;
        tooltip.style.top = `${e.pageY + 12}px`;
        tooltip.style.display = 'block';
        console.log('Displaying tooltip for word:', word, entry);
      } else {
        tooltip.style.display = 'none';
        console.log('No entry found for word, hiding tooltip:', word);
      }
    }, 80);
  });

  document.addEventListener('scroll', () => {
    tooltip.style.display = 'none'; // hide on scroll to avoid artifacts
    console.log('Scroll event, hiding tooltip.');
  }, true);
})();