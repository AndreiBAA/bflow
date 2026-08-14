# BFlow - task tracker personal (Andrei Bran)

Board Kanban cu statusuri custom, jurnal de activitate per task, dark mode. Next.js + Supabase.

## Setup

1. Creeaza un proiect Supabase, ruleaza supabase/schema.sql in SQL Editor.
2. 2. Copiaza .env.local.example in .env.local si completeaza cu URL-ul si cheia publishable din Supabase.
   3. 3. npm install
      4. 4. npm run dev
        
         5. ## Deploy
        
         6. Conecteaza acest repo la Vercel, adauga variabilele de mediu (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) si Deploy.
        
         7. ## Nota de securitate
        
         8. Baza de date e configurata cu acces deschis (oricine are link-ul + cheia publishable poate citi/scrie) - simplificare intentionata pentru varianta solo-user. Nu distribui link-ul public.
         9. 
