# AI workflow for this Pages repository

For ChatGPT/Codex changes to apps and games in this repository:

1. Treat screenshots as diagnostic input. Modify the actual HTML/CSS/JS/SVG/source files.
2. Never invoke image generation unless the user explicitly asks to generate/create an image.
3. For phone-targeted projects, mobile/Android usability is a release criterion, not a later polish pass.
4. Default deployment target is the existing `sebgrijalva.github.io` repository under the project's subdirectory. Do not stop to create a separate repository unless requested.
5. Use the end-to-end loop: inspect current deployed source -> implement -> run project tests -> inspect the diff/scope -> push -> wait for Pages workflow -> verify the deployed artifact/site.
6. Do not claim deployment merely because files were generated or a commit was created. Verify the Pages workflow and deployed artifact.
7. Do not include unrelated repository changes in a project deployment.
