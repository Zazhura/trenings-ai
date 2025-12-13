# POLICY

## Hva er denne filen?

Prosjektspesifikk policy som definerer hvilke regler og profiler som gjelder for dette prosjektet. Overstyrer eller spesialiserer globale policyer.

## Hvordan brukes den?

- Velger hvilken policy-profil som skal brukes
- Dokumenterer prosjektspesifikke overstyrer
- Definerer prosjektets retningslinjer
- Refererer til Policy_Profiles.md og Policy_Tuning.md

## Arbeidsflyt

POLICY settes opp ved prosjektstart og definerer hvordan tasks skal utføres. Den brukes som referanse for alle beslutninger om stopp, retry og kvalitetskrav.

---

# Aktiv policy: Balanced-A

Aggressiv fremdrift. Stopp kun ved røde gates, manglende secrets eller destruktive DB-endringer.

