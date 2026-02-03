
# Plan: Database migratie van enum naar text voor categorieën

## Probleem

De `categorie` kolom in de `costs` tabel gebruikt een PostgreSQL enum (`cost_category`) met vaste waarden:
- Materiaal, Arbeid, Vergunningen, Overig, Kluswerkzaamheden, Decoratie, Meubels

Je hebt "Apparatuur" als custom categorie toegevoegd via de Categorieën-instellingen, maar de database accepteert alleen de vaste enum-waarden. Hierdoor krijg je de foutmelding:

> invalid input value for enum cost_category: "Apparatuur"

---

## Oplossing

Een database-migratie uitvoeren om de `categorie` kolom te wijzigen van `cost_category` enum naar `TEXT`. Dit maakt dynamische categorieën mogelijk.

---

## Technische wijzigingen

### Database migratie (supabase/migrations/...)

```sql
-- Stap 1: Wijzig kolom van enum naar text
ALTER TABLE costs 
  ALTER COLUMN categorie TYPE TEXT 
  USING categorie::TEXT;

-- Stap 2: Verwijder de ongebruikte enum type (optioneel, voor opschonen)
DROP TYPE IF EXISTS cost_category;
```

---

## Voordelen na migratie

| Voor | Na |
|------|-----|
| Alleen 7 vaste categorieën | Onbeperkte custom categorieën |
| Foutmelding bij nieuwe categorie | Elke categorie werkt |
| Wijzigingen vereisen DB migratie | Wijzigingen via UI direct actief |

---

## Bestaande data

Alle bestaande kosten behouden hun huidige categorie-waarden. Er gaat geen data verloren.

---

## Bestanden te wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `supabase/migrations/[timestamp]_convert_cost_category_to_text.sql` | **Nieuw** - Migratie script |
