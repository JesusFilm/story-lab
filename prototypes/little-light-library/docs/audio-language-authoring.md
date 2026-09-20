# Soundtracks, languages and author review

Open **Author → My books → Edit**, then **Preview audio & languages**. The advanced
editor also has an **Audio & languages** tab. This workspace has three sections:
Soundtrack, Languages & voices, and Preview & review. The original On the book
preview remains a quick visual composition check; the production preview combines
text, measured narration, soundtrack layers, animation and interactions.

## Compose the sound

Import a WAV, MP3 or Ogg soundtrack, or add a track using an existing audio asset.
Multiple tracks may overlap. Each has a name, inclusive start/end page, volume
(0–1), fade-in/out (0–60 seconds), optional looping, and seconds trimmed from the
beginning/end of its page range. Trimming changes the placement on the book timeline;
it does not trim the beginning of the source recording. A non-looping recording ends
naturally if it is shorter than its page range. Fades are bounded to the resulting
clip; overlapping fades form an envelope rather than stacking volume.

Set narration volume separately. Page minimum time defaults to eight seconds and
can be 1–600 seconds. Actual page time is the greater of that minimum and the sum
of measured narration durations in the chosen language. Thus a longer translation
extends its page and moves subsequent page boundaries and soundtrack anchors.

**Load preview** decodes the recordings and updates the timeline to their actual
lengths. Before loading, non-looping soundtrack bars show their requested page range;
after loading they show their measured natural end. Click a page in the timeline or
scrub to any point. Play runs through the book; pause, restart, mute and reduced motion
are available. The text highlights follow the audio clock. Artwork uses the reader's
shared paper stage. Page changes wait for artwork to load before resuming playback.
The reader uses the same audio mixer but keeps its manual Next/Previous navigation.

When a page has missing/stale narration, all narration on that page is suppressed,
so phrases cannot play out of order. Soundtracks and text can still be checked in the
production preview. Such a page cannot receive a current review approval.

## Translate the book

Select intended release languages, or select all nine supported library languages:
US/UK English, Spanish, French, Hindi, Italian, Japanese, Brazilian Portuguese and
Simplified Chinese. The source language remains included. Removing a language from
the release selection retains its translation, recordings and preferences for reuse.

Enter an OpenRouter API key and model in **Languages & voices**. The default model
identifier is `google/gemini-3-flash-preview`; it is editable. The selected model must
support structured JSON output. The integration uses OpenRouter's
[structured-output chat API](https://openrouter.ai/docs/guides/features/structured-outputs),
with parameter-compatible provider routing and client-side response validation.

**Generate missing / outdated translations** sends only book text, in order, for each
missing or source-stale language. Titles, source references, retelling notes, story
phrases, element names and interaction text are included. Staging instructions and
media are excluded. A language is applied only after the complete response validates;
a failed request keeps its previous version. Completed languages remain saved if a
later request fails or the batch is cancelled. No background retries incur extra calls.

The key lives only in page memory. It is sent only in the Authorization header to
OpenRouter, never stored in browser book data, portable JSON or source files. **Clear
key** removes it; reloading also clears it. Model choice lasts for the current session.
No live OpenRouter request was made during implementation verification.

Select a preview language to edit its translation beside the corresponding source
text. Regenerating one language replaces its text. Source edits make translations
outdated. After manually reconciling a translation, explicitly acknowledge that it
matches the current source. Incomplete structures still require regeneration; that
acknowledgment cannot repair missing pages/phrases. Translation is a draft, not an
editorial approval or a claim of a verified Bible translation.

## Generate narration with Kokoro

Start the existing local service from the repository root:

```sh
cd projects/kokoro-voice-lab
uv run python server.py
```

In another terminal, start the editor:

```sh
cd prototypes/little-light-library
npm run dev
```

Vite proxies the editor's `/api/kokoro` requests to loopback port 8770. If Vite was
already running before its configuration was added, restart it. This integration
is local-development-only; a published static reader needs no synthesis service.

Choose **Connect to Kokoro**, then select a voice and recording speed (0.5–2) for
each language. Voice choices are filtered by Kokoro language prefix. Generation is
supported for the nine languages listed above; other imported source locales remain
readable and can use manually supplied narration through Spreads.

Generate the selected language or all selected languages. Current recordings using
the chosen voice and speed are skipped. Each successful phrase is decoded to measure
its duration, embedded in the book, paired with its exact recorded text, and saved.
Unchanged translated phrases keep their existing recordings when translation runs
again. Text, voice or speed changes require the affected recording to be regenerated.
Cancel stops the batch and retains completed work. Leaving production cancels active
generation. Old recordings are removed only when nothing else references them.

Portable books remain bounded: 1,024 registered assets, 32 MiB per asset and 96 MiB
of decoded media in a package. Generation stops with a useful message before adding
an asset beyond those limits; a maximum-size 40-page, nine-language book may need
shorter phrases, compressed supplied recordings, smaller images or splitting into
volumes. The browser must still have enough local storage available.

## Audit before release

**Preview & review** lists every selected language and page. Load each version,
listen to its narration and soundtrack, inspect the text and animation, and try its
interactions. **I reviewed this page** is the author's explicit attestation after
opening its current preview; the software cannot judge pronunciation, meaning,
age suitability or whether the author actually listened.

Approval fingerprints cover the rendered page, relevant media, language, mix and
page timing. Changing them invalidates the relevant reviews. Missing translations,
outdated source text, missing/stale recordings and unreviewed pages keep **Export
reviewed book** unavailable. Export additionally validates every image/audio asset
and checks measured narration durations. Embedding identical media preserves current
approvals across export/re-import. Asset paths whose file bytes change outside the
editor require a new author review; fingerprints are change detection for book data,
not cryptographic release signatures.

The ordinary **Export portable JSON** remains available for drafts. Reviewed export
also remains a draft-format book; it does not publish or release anything. Imported
books contain all languages, soundtrack settings and recordings, and play without
OpenRouter, Kokoro or credentials.

## Verification commands

```sh
npm run check:fast
npm run lint
npm run validate
npm run build
npm run test:authoring
npm run test:production
```

The production browser suite uses isolated storage, a nested static URL and controlled
OpenRouter/Kokoro responses. It verifies nine-language batch behavior, cancellation,
key exclusion, mixes, seeking, language changes, review invalidation, portable and
reviewed export/re-import, reader playback and narrow layouts. It does not establish
translation quality or subjective listening approval. The separate live local Kokoro
check produced English (2.325 s) and Spanish (2.125 s) WAVs at 24 kHz through the editor
proxy. No author approval was added to the user's saved books during testing.
