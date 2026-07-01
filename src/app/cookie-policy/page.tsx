import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | JobFusion',
  description: 'Understand how JobFusion uses cookies to improve your experience.',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-3xl p-8 sm:p-12">
          <h1 className="text-4xl font-bold mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <span className="gradient-brand-text">Cookie </span>
            Policy
          </h1>
          <p className="text-muted-foreground mb-10">Last Updated: July 1, 2026</p>
          
          <div className="space-y-8 text-foreground/90 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. What Are Cookies?</h2>
              <p>Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used in order to make websites work, or work more efficiently, as well as to provide reporting information to the site owners.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. How We Use Cookies</h2>
              <p>We use cookies for a variety of reasons detailed below. Unfortunately, in most cases, there are no industry standard options for disabling cookies without completely disabling the functionality and features they add to this site. It is recommended that you leave on all cookies if you are not sure whether you need them or not in case they are used to provide a service that you use.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. The Cookies We Set</h2>
              <ul className="list-disc pl-6 mt-4 space-y-4 text-muted-foreground">
                <li>
                  <strong className="text-foreground block mb-1">Account related cookies</strong>
                  If you create an account with us, we will use cookies for the management of the signup process and general administration. These cookies will usually be deleted when you log out; however, in some cases, they may remain afterwards to remember your site preferences when logged out.
                </li>
                <li>
                  <strong className="text-foreground block mb-1">Login related cookies</strong>
                  We use cookies when you are logged in so that we can remember this fact. This prevents you from having to log in every single time you visit a new page. These cookies are typically removed or cleared when you log out.
                </li>
                <li>
                  <strong className="text-foreground block mb-1">Site preferences cookies</strong>
                  In order to provide you with a great experience on this site, we provide the functionality to set your preferences for how this site runs when you use it. In order to remember your preferences, we need to set cookies so that this information can be called whenever you interact with a page affected by your preferences.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Third-Party Cookies</h2>
              <p>In some special cases, we also use cookies provided by trusted third parties. The following section details which third party cookies you might encounter through this site.</p>
              <p className="mt-4">This site uses Google Analytics, which is one of the most widespread and trusted analytics solutions on the web, for helping us to understand how you use the site and ways that we can improve your experience. These cookies may track things such as how long you spend on the site and the pages that you visit so we can continue to produce engaging content.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Disabling Cookies</h2>
              <p>You can prevent the setting of cookies by adjusting the settings on your browser (see your browser Help for how to do this). Be aware that disabling cookies will affect the functionality of this and many other websites that you visit. Disabling cookies will usually result in also disabling certain functionality and features of this site. Therefore, it is recommended that you do not disable cookies.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. More Information</h2>
              <p>Hopefully, that has clarified things for you. If there is something that you aren't sure whether you need or not, it's usually safer to leave cookies enabled in case it does interact with one of the features you use on our site.</p>
              <p className="mt-4">For more information, please contact us at privacy@jobfusion.com.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
