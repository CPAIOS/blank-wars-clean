// Debug script to find white overlays
// Run this in browser console to find problematic elements

console.log('=== DEBUGGING WHITE OVERLAY ===');

// Find all elements with white backgrounds
const whiteElements = Array.from(document.querySelectorAll('*')).filter(el => {
  const style = window.getComputedStyle(el);
  return style.backgroundColor === 'rgb(255, 255, 255)' || 
         style.backgroundColor === 'white' ||
         el.className.includes('bg-white');
});

console.log('Elements with white backgrounds:', whiteElements);

// Find all fixed/absolute positioned elements with high z-index
const highZElements = Array.from(document.querySelectorAll('*')).filter(el => {
  const style = window.getComputedStyle(el);
  const zIndex = parseInt(style.zIndex);
  return (style.position === 'fixed' || style.position === 'absolute') && 
         zIndex > 30;
});

console.log('High z-index positioned elements:', highZElements);

// Find elements that might be blocking clicks
const blockingElements = Array.from(document.querySelectorAll('*')).filter(el => {
  const style = window.getComputedStyle(el);
  return style.pointerEvents === 'auto' && 
         (style.position === 'fixed' || style.position === 'absolute') &&
         parseInt(style.zIndex) > 30;
});

console.log('Potentially blocking elements:', blockingElements);