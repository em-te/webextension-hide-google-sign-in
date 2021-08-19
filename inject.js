document.querySelectorAll('script[src="https://accounts.google.com/gsi/client"]').forEach(
  node => {
    const sc = document.createElement("script");
    sc.async = true;
    sc.defer = true;
    sc.src = new URL(location.href).origin + "/accounts.google.com/gsi/client";  //bypass CSP
    node.parentNode.insertBefore(sc, node.nextSibling);
  }
);
