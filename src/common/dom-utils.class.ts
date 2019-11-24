export class DOMUtils {
  public static focusAndOpenKeyboard(el: any, timeout: number) {
    if (el) {
      // Align temp input element approximately where the input element is
      // so the cursor doesn't jump around
      var __tempEl__ = document.createElement('input');
      __tempEl__.style.position = 'absolute';
      __tempEl__.style.top = (el.offsetTop + 7) + 'px';
      __tempEl__.style.left = el.offsetLeft + 'px';
      __tempEl__.style.height = '0';
      __tempEl__.style.opacity = '0';
      // Put this temp element as a child of the page <body> and focus on it
      document.body.appendChild(__tempEl__);
      __tempEl__.focus();
      // The keyboard is open. Now do a delayed focus on the target element
      setTimeout(function() {
        el.focus();
        el.click();
        // Remove the temp element
        document.body.removeChild(__tempEl__);
      }, timeout);
    }
  }

  public static downloadCSV(filename: string, text: string) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,%EF%BB%BF' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  public static copyToClipboard(text: string): boolean {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position='fixed';
    ta.style.opacity = '0.0';
    ta.style.width = '20px';
    ta.style.height = '20px';
    ta.style.top = '-40px';
    ta.style.left = '-40px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      var successful = document.execCommand('copy');
      return successful;
    } catch (err) {
      return false;
    }
    document.body.removeChild(ta);
  }
}
