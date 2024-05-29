const GoogleAnalytics = () => {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `
 <!-- Google tag (gtag.js) -->
 <script async src="https://www.googletagmanager.com/gtag/js?id=G-X1NYE9KQRZ"></script>
 <script>
   window.dataLayer = window.dataLayer || [];
   function gtag(){dataLayer.push(arguments);}
   gtag('js', new Date());
 
   gtag('config', 'G-X1NYE9KQRZ');
 </script>
 `,
      }}
    ></div>
  );
};

export default GoogleAnalytics;
