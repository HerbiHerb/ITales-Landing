# ITales Landing

A static, English ITales interest site: home, Game preview, Editor preview and a short feedback form. The legal and privacy pages use the existing ITales operator details. No application backend, login or Firebase dependency is included.

## Local development

Requires Node.js 24 and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

The feedback form is configured with `https://formspree.io/f/xvkgdppk` in `src/config/services.js` and works without a local environment file. It uses the existing Vanilla JS AJAX integration with native `fetch`, including validation, pending state, retained answers on errors and confirmed success. No additional SDK is needed.

The ITales GA4 measurement ID `G-8W3LYVD7NH` is also configured in `src/config/services.js`. Analytics loads only after consent. You can override either public identifier in `.env.local`:

```dotenv
VITE_FORMSPREE_FORM_ID=xvkgdppk
VITE_GA_MEASUREMENT_ID=G-8W3LYVD7NH
VITE_BASE_PATH=./
```

Use the last part of `https://formspree.io/f/your_form_id` as the Formspree ID. These identifiers are intentionally public; never add private service keys. `.env.local` is ignored by Git.

```sh
npm run build
npm run preview
```

`npm run build` permits a preview with the configured services. Invalid service identifiers disable the corresponding integration instead of simulating success. `npm run build:production` requires a valid form endpoint and GA4 ID; both built-in identifiers satisfy these requirements. Browser tests override them with fictional identifiers and intercept external requests.

## Content and media

Page copy is in the HTML pages. Shared navigation, footer and consent markup live in `src/templates/shell.js` and are inserted by Vite into every HTML page during development and build. The resulting pages remain navigable without JavaScript.

`src/config/media.js` maps each section to its local image, alternative text, optional video, poster and captions. Paths are relative to `public/`. For example:

```js
gameWorlds: {
  image: 'assets/media/game-worlds.webp',
  alt: 'An ITales scene with story text and choices',
  video: 'assets/media/game-worlds.mp4',
  poster: 'assets/media/game-worlds.webp',
  captions: 'assets/media/game-worlds.vtt',
  caption: 'ITales Game preview',
}
```

Empty video values show only the configured image. Videos have native controls, no autoplay and `preload="none"`. Use MP4 or WebM, short recordings and WebVTT captions for spoken content. Existing media are illustrations, not application screenshots. Set the optional `caption` when replacing illustrations with real screenshots. The carousel has three image-only entries in the same configuration. Images below the hero load lazily; fonts are served locally with their OFL licenses.

To optimize a replacement image:

```sh
npm run optimize:media -- path/to/image.png public/assets/media/image.webp
```

## Formspree setup

1. The ITales form ID is already configured as `xvkgdppk`. Link and verify `feedback@itales.eu` in the Formspree account, then select it as the target address in the form's Workflow → Email settings. Changing the contact links on this website does not change the Formspree recipient. If replacing the form later, override its public ID with `VITE_FORMSPREE_FORM_ID`.
2. Keep the form compatible with JSON/AJAX submissions. No email field should be required: feedback without an email must work. The form uses Formspree's basic spam filtering; if you enable CAPTCHA, the matching client integration must be added first.
3. Restrict submissions to the deployed domain using Formspree's form settings where appropriate.
4. Send a real test both without email and with email plus notification consent. Confirm that the answers arrive in the dashboard and receiving inbox.

Responses go directly from the browser to Formspree. Only a successful response with `ok: true` shows the success screen and emits `interest_submit_success`. Network, service and validation errors retain answers. A timeout cannot establish whether Formspree received the request, so the site reports that uncertainty and never retries automatically.

The free plan currently allows 50 submissions per month and a 30-day dashboard archive. Submission export is a paid feature. Receiving emails are separate copies: review capacity and delete feedback and contact details when their stated purposes end. No automatic launch emails or recurring newsletter are implemented.

Provider references: [AJAX forms](https://help.formspree.io/articles/building-your-form/submit-forms-with-javascript-ajax/), [changing the recipient email](https://help.formspree.io/articles/form-and-project-settings/changing-a-form-email-address), [plans](https://formspree.io/plans/).

## GA4 setup and evaluation

1. The ITales web stream is configured as `G-8W3LYVD7NH`. Check that this stream's website URL matches the deployed site.
2. In Enhanced measurement, disable **Form interactions**. The site's success event only fires when Formspree confirms receipt; automatic `form_submit` is not used as success.
3. Keep advertising-related consent denied and disable unused advertising/data-sharing features in the account. Keep user- and event-data retention at **2 months** to match the privacy notice. Review “Reset user data on new activity”; the notice explains that user-identifier retention may restart. The retention setting does not expire standard aggregated reports.
4. Create event-scoped custom dimensions for `source_page` and `cta_position`.
5. Mark `interest_submit_success` as a key event. Do not mark button clicks or form starts as successful responses.
6. After allowing analytics, verify `page_view`, `interest_click`, `interest_form_start` and `interest_submit_success` in Realtime/DebugView. For DebugView, use the Google Analytics Debugger browser extension during the real test.

Analytics scripts load only after explicit consent. Declining prevents Google requests; revocation blocks tracking and removes this site's prefixed cookies. The choice is honoured for 180 days, is shared across the pages, and is scoped to the site's base path. Its local-storage entry remains until replaced or cleared; returning after expiry prompts for a new choice. Analytics cookies are configured for 180 days and can be renewed on subsequent visits with consent. No email, comment or survey answers enter GA4. Page URLs and referrers are stripped of query parameters and fragments.

Use a consistent cohort and unique users rather than raw event counts:

| Metric | Evaluation |
| --- | --- |
| Reach | Users who visited home, Game or Editor after consenting |
| CTA rate | Users who clicked an interest button / users who visited those pages |
| Form completion | Users with confirmed submission / users who started the form |
| Game vs. Editor | Compare the same funnel by `source_page` |
| Total feedback | All received answers in Formspree, including visitors who declined Analytics |
| Interest quality | Distribution of interest area, 1–5 ratings, comments and optional notification requests in Formspree |

Set up a GA4 funnel exploration for page visit → `interest_click` → `interest_form_start` → `interest_submit_success`. Keep direct form visitors separate where appropriate. Analytics results cover only consenting, measurable visitors; never divide all Formspree responses by GA4 visitors. Small samples are directional feedback, not a universal success/failure verdict.

Provider references: [custom events](https://developers.google.com/analytics/devguides/collection/ga4/events), [basic consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode).

## Legal notice and privacy

`impressum.html` describes this preview and feedback site. Its operator name/address are inherited from ITales-Frontend; confirm they identify the actual operator before publishing. The additional editorial responsibility under § 18(2) MStV was removed because this site presents product previews and a survey. Reassess that section if journalistic/editorial content is added.

`privacy.html` covers GitHub Pages, Formspree, enquiries and notification copies in the Hostinger mailbox, optional launch contacts, GA4 consent, browser storage, retention criteria, international-transfer safeguards and visitor rights. The GA4 user/event retention of two months is confirmed by the operator. Cookie renewal, renewal of user-identifier retention and aggregate-report retention are disclosed separately.

Operational details to keep consistent with the published notice:

- Confirm the Hostinger email product and contracting entity shown in the account; the notice currently describes Hostinger email. If a different mail provider or a Gmail forwarder is used, update the recipients and transfer information.
- Check the applicable processor agreements and transfer terms for Formspree, Hostinger and Google in the service accounts. Links in the notice describe providers' published safeguards; they do not establish which account terms have been accepted. Do not claim an agreement was signed or an account option was enabled without checking it.
- Apply the stated deletion criteria to both Formspree submissions and mailbox copies: feedback when no longer needed for the study, enquiries after necessary follow-up, launch contacts after the announcement, withdrawal or abandonment. Keep only required legal records or anonymous summaries beyond those purposes. Formspree's dashboard archive window does not delete mailbox copies.
- Record review/end dates for the interest study and notification list, and perform deletion/anonymisation when their purposes end. The site does not automatically delete records in external services.
- Keep Analytics settings aligned with the notice, including two-month user/event retention, the effect of reset on new activity and disabled automatic form measurement. The frontend cannot set or verify the property's server-side retention or account data-sharing options.

References: [§ 5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html), [§ 18 MStV](https://www.gesetze-bayern.de/Content/Document/MStV-18?view=Print), [§ 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html), [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj), [Hostinger DPA](https://www.hostinger.com/legal/dpa), [Formspree security and transfer safeguards](https://formspree.io/security/), [Google transfer information](https://business.safety.google/adsdatatransfers/), [GA4 data retention](https://support.google.com/analytics/answer/7667196?hl=en), [Analytics cookie configuration](https://developers.google.com/analytics/devguides/collection/ga4/reference/config#cookie_update).

## Browser checks

```sh
npx playwright install --with-deps chromium
npm test
```

Playwright builds and serves the actual HTML/CSS/JS twice, at `/` and `/ITales-Landing/`. External Formspree and Google endpoints are intercepted; automated tests do not send real feedback or analytics. Tests cover responsive pages and assets, direct reloads, navigation, reduced motion, form validation, optional email consent, confirmed submissions, double-send prevention, retained answers on errors and analytics consent/revocation.

A custom Chromium executable can optionally be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

## GitHub Pages

The workflow checks builds and browser tests on pull requests. Pushes to `main` and manual workflow runs on `main` also build and deploy `dist` after checks pass.

1. In repository **Settings → Pages**, select **GitHub Actions** as the source.
2. The public Formspree and GA4 identifiers are already configured. Optional repository Actions variables `VITE_FORMSPREE_FORM_ID` and `VITE_GA_MEASUREMENT_ID` can override them.
3. Merge the prepared changes into `main` when ready to publish. The workflow gets the correct base path from GitHub Pages; it supports both project sites and custom domains.
4. On the deployed URL, verify direct Game/Editor/form links, the real Formspree test and GA4 DebugView with consent allowed. With consent declined, verify no Google requests and a working form.

Before publishing, confirm the inherited operator/contact details and that service settings match the privacy notice. No external accounts or repository settings are changed by the implementation.
