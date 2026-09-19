# ADR 002 — Local review remains outside portal publication

The repository pre-commit publication checker treated every prototype source change as publishable. This conflicts with the explicit local-only delivery scope. The publication manifest now supports an exact `local_only_prototypes` slug list. Its checker still rejects unregistered prototype changes, stale reviewed hashes and module-closure failures; it also rejects any file being both local-only and published. Tests exercise those boundaries. Little Light Library has no portal tile or published runtime file list.

New reusable library assets may be added to the local asset gallery using explicit model/reference/prompt fields and reviewed hashes, as required by the asset workflow. This does not publish the prototype or authorize deployment. No push or deployment is part of this work.
