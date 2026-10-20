# Privacy, consent and claims workstream

Started 2026-10-19 from the site-wide copy review. Not legal advice: the aim is to make the site's
privacy page match what the site actually does, and to keep proof on file for every public claim.

## Done (2026-10-19)

- Privacy policy, effective date moved to October 19, 2026:
  - "What I collect" now lists everything the contact form takes (name, email, website if given,
    services picked, message) and the Cal.com booking form.
  - "Who processes it" adds Cal.com (bookings). Google Fonts and cdnjs were listed briefly, then dropped
    once fonts and opentype.js were self-hosted the same day.
  - Security line names Netlify, Zoho and Cal.com.
  - Retention no longer contradicts itself ("kept only as long as needed, and deleted sooner on request").

## To do

1. ~~Cal.com loading~~ done 2026-10-19: the embed now loads only on the first "Book a call" click, so
   nothing reaches Cal.com for visitors who never book. Still worth a look: whether the booking pop-up
   itself sets non-essential cookies once opened (it runs inside Cal.com's own frame).
2. ~~Self-host fonts and opentype.js~~ done 2026-10-19 (`assets/css/hs-fonts.css`, `assets/fonts/`,
   `assets/js/opentype.min.js`). Google Fonts and Cloudflare are off the privacy policy.
3. **Consent pop-up.** Not needed while the site sets no analytics or advertising cookies (true today).
   Build it before adding GA4, Google Ads tags or the Meta pixel: a small banner with Accept / Decline,
   nothing non-essential loads until Accept, the choice remembered, a "Cookie settings" link in the footer
   to change it. The policy already promises this ("a banner will let you accept or decline").
4. **Processor agreements.** Keep copies of Netlify's, Zoho's and Cal.com's data processing terms.
5. **Proof on file for public claims:**
   - About stats: ~10 years, $15M+ annual ad spend managed for five years running (confirmed true by
     Aidan; it describes spend managed, not performance).
   - Greenlife: Roy's written OK for his name, numbers, screenshots, photos and the quoted review
     (verbal OK given; get it in writing). Review requests go to every guest (no review gating).
   - Maki Moto and KreativExpo: written OK to show their logos as in-progress work (verbal OK given).
6. **Contracts named in the Terms.** Make sure the "Handstart Digital Master Services Agreement" and
   "Statement of Work" exist under those names.
7. **Ad platform eligibility.** LLM ads (ChatGPT, Gemini, Copilot) and some other ad products depend on
   platform eligibility. Proposed: one short note under the Services ad panel rather than "(if eligible)"
   after every mention (waiting on Aidan's call).
