# Google Play Console submission draft

Use this as a starting point in Play Console. Reconfirm every declaration against the production build before submitting.

## Store listing

- **App name:** On This Site
- **Default language:** English (United States)
- **App or game:** App
- **Category:** Education
- **Contains ads:** No
- **Contact email:** onthissiteny@gmail.com
- **Privacy policy:** https://nativelongisland.com/privacy-policy.html
- **Account deletion:** https://nativelongisland.com/account-deletion.html

**Short description**

Explore Indigenous history, places, archives, and community knowledge across Long Island.

**Full description**

On This Site is a Native Long Island history and mapping project by Jeremy Dennis. Explore hundreds of places, wiki articles, historic moments, photographs, and learning resources connected to Indigenous history across Long Island.

Use the interactive map or search to find nearby places and public archive entries. Read place histories, follow biography and learning paths, browse timeline moments, and save useful context for offline access.

Optional contributor accounts support moderated community notes, visitor photographs, site suggestions, check-ins, learning activity, and public profile features. Location is requested only when you choose a location-dependent feature such as Near me, check-in, or Use my location. Camera and photo access are requested only when you choose to contribute an image.

The project is designed for learning and respectful engagement. Some sensitive or non-public places are intentionally generalized, limited, or marked as inappropriate for public visits.

## App access / reviewer instructions

The public map, search, archive entries, timeline, and offline archive do not require an account. Contributor tools require an approved test account.

Before review, create a disposable approved contributor account and enter its email and password in Play Console under **App access**. Reviewer steps:

1. Launch the app; no permission is required to browse.
2. Tap **Near me** to test the foreground location request. Denying it must leave the archive usable.
3. Open **Login**, use the supplied reviewer account, and open a public listing.
4. Use Community Notes to exercise comment/photo selection without publishing permanent test content, or state clearly if the reviewer may post and delete a temporary test comment.
5. Open the account screen to find **Privacy policy** and **Delete account and data**.

## Permission declarations

- **Foreground precise/coarse location:** nearby sorting, user-position marker, proximity/check-in distance, and intentional location-based contributions. No background location. A close-range check-in needs precise enough location to enforce the approximately 260-foot radius.
- **Camera:** user-initiated comment, plant, and map-story photo capture. The camera feature is optional.
- **Notifications:** optional nearby/history alerts after user opt-in.
- **Network:** map, archive, account, and contribution services.

## Target audience and content

- General-audience educational archive; not designed specifically for children.
- No advertising, gambling, financial products, health claims, or dating features.
- User-generated comments and photographs are moderated; reporting and deletion tools should be described in the content-rating questionnaire.
- Historic material may discuss colonization, dispossession, burial grounds, violence, or missing and murdered Indigenous people in educational context. Answer the content-rating questionnaire from the actual published content rather than assuming a rating.

## Release track

Start with **Internal testing** using the CI-produced `app-release.aab`. Confirm Play App Signing enrollment, upload-key certificate, automatic pre-launch report, device exclusions, warnings, and Data safety review before promoting to closed or production testing.
