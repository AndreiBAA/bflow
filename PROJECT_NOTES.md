# BRN — Note de proiect (pentru continuitate intre sesiuni AI)

Acest fisier exista ca sa poata orice sesiune noua (AI sau om) sa inteleaga rapid stadiul proiectului fara sa reciteasca tot istoricul de commit-uri.

## Ce este BRN

Task tracker intern pentru Andrei Bran (Ruris, echipamente agricole). Fost numit "BFlow", redenumit "BRN" (Blocked · Running · Next).

- Repo GitHub: `AndreiBAA/bflow` (numele repo-ului a ramas `bflow`, doar continutul/branding-ul e "BRN")
- Proiect Vercel: `brn4/bflow`, branch de productie `main`
- URL productie: `bflow-tau.vercel.app`
- Stack: Next.js 14 (App Router), React 18, Tailwind CSS, Supabase (Postgres + Auth), hosting Vercel

## Cum se editeaza codul (important!)

Nu exista acces local la git in mediul de lucru curent — toate modificarile se fac prin editorul web GitHub (CodeMirror), navigat printr-un browser automatizat. De aceea:

- Comentariile de commit sunt uneori generate/concatenate de Copilot in mod ciudat (cosmetic, nu afecteaza functionalitatea).
- Upload de fisiere binare (imagini) prin pagina GitHub `/upload` poate necesita un truc: injectare via JS (`base64 → Uint8Array → File → DataTransfer → input.files`), pentru ca tool-ul standard de upload refuza cai locale.
- Selectarea de linii in editor prin click+shift-click e fragila (coordonatele pe ecran nu corespund mereu exact liniilor) — verifica intotdeauna cu un screenshot inainte sa inlocuiesti cod, mai ales la JSX cu tag-uri imbricate (risc de div/span nebalansat → build failure).

## Deploy pe Vercel

Deploy-ul automat prin webhook GitHub functioneaza in general, dar au existat cazuri cand un commit nou nu a declansat automat un deployment. Workaround: Vercel → Deployments → meniul „..." → **Create Deployment** → lipeste `https://github.com/AndreiBAA/bflow/tree/main` → apare butonul „Deploy to Production" pentru commit-ul curent de pe `main`.

Cand un build da eroare de sintaxa JSX, verifica Build Logs (are numarul exact de linie si un caret `^^^^^^`) — de obicei e un tag `<div>`/`</div>` nebalansat introdus la o editare anterioara.

## Structura date (Supabase)

- `profiles` — utilizatori, rol (`admin` / `manager` / `member`), nume
- `projects` — proiecte si subproiecte (`parent_id` pentru ierarhie), `position` pentru ordine
- `statuses` — statusuri custom pentru board (Kanban), `position` pentru ordine coloane
- `tasks` — task-uri, legate de `project_id`, `status_id`, `assignee` (profil real)
- `project_managers` — manageri asociati per proiect
- `change_requests` — cereri de aprobare pentru editare/stergere task (flux de aprobare pentru membri non-privilegiati)
- `notifications` — notificari per user (ex. asignare task, schimbare status)

Acces DB in prezent: open access cu cheia publishable (simplificare intentionata pentru varianta solo/echipa mica — nu distribui link-ul/cheile public).

## Functionalitati implementate

- Board Kanban cu statusuri custom + jurnal de activitate per task
- Vizualizare Gantt/roadmap
- Autentificare Supabase Auth + pagina `/login`
- Roluri: admin, manager, member — dashboard admin pentru gestionare useri (`/admin`)
- Flux aprobare: membrii non-privilegiati trimit cereri de editare/stergere, managerii/adminii aproba
- Notificari (clopotel) la asignare task / schimbare status
- Dropdown proiect/subproiect cu indentare vizuala; filtrare task-uri per proiect (include subproiecte)
- Filtru "Task-urile mele" vs toate
- Meniu user (avatar, cont, logout) + pagina `/account`
- Branding BRN: logo `public/brn-logo.png` (imagine furnizata de Andrei, NU se mai foloseste logo-ul Ruris vechi sau text stilizat "BRN") + subtitlu "Blocked · Running · Next" sub logo, pe pagina de login si in header-ul aplicatiei

## Backlog ramas (vezi si task list-ul din Cowork)

- Self-signup cu aprobare admin pe pagina de login
- Dashboard admin complet (extindere fata de gestionarea de baza a userilor)
- Drag and drop pentru reordonare coloane status in Board
- Responsive layout — verificare/fix pe toate dimensiunile de ecran
- Assignee multiplu cu autocomplete si free text (in prezent: un singur assignee legat de profil real)
- Tab Roadmap: dashboard cu piecharturi + gantt saptamanal exportabil

## Constrangeri de context

- Fisierul original `Plan de implementare GENERAL Proiecte.xlsx` este strict read-only — nu se modifica niciodata. Toata munca se face doar in app/repo/DB-ul BRN.
