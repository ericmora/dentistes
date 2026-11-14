# Especificació i Disseny de la Landing Page: Software de Gestió Dental

## 1\. Objectiu Estratègic i Posicionament

- **Objectiu:** Captació massiva de clíniques dentals petites i mitjanes amb alta conversió de trànsit a demostració / alta directa.  
- **Model de Posicionament:** Democratització del software dental mitjançant una tarifa plana real, sense quotes per facultatiu ni costos d'alta ocults.  
- **To de comunicació:** Pràctic, àgil, directe, transparent i orientat a l'estalvi operatiu.

---

## 2\. Arquitectura de Seccions de la Landing Page

### Secció 1: Header i Hero Section

- **Pre-titular:** "El programari de gestió dental pensat per a clíniques independents"  
- **Titular Principal (H1):** "La teva clínica creix. La teva quota es manté."  
- **Subtitular:** "Agenda multigabinet en temps real, odontograma vectorial interactiu, historial clínic amb alertes i facturació VeriFactu/TicketBAI. Tot inclòs per una tarifa plana, sense límit de doctors ni sorpreses a final de mes."  
- **Crida a l'Acció (CTA Primari):** "Comença la teva prova de 30 dies gratis" (Botó destacat)  
- **Crida a l'Acció (CTA Secundari):** "Sol·licita una demo de 15 minuts" (Enllaç/Botó d'acció ràpida)  
- **Element de confiança:** "Sense targeta de crèdit • 0 € de cost d'alta • Migració de dades assistida gratuïta"  
- **Element visual interactiu:** Maqueta interactiva/animació de l'agenda multigabinet amb arrossegament de cites i codificació per colors.

---

### Secció 2: Barra de Validació i Problema / Fricció del Sector

- **Titular de contrast:** "Prou de pagar un peatge cada cop que incorpores un odontòleg"  
- **Matriu de contrast visual:**  
  - *El model clàssic (altres proveïdors):* Quota base cara \+ 40 € a 100 € per cada doctor col·laborador \+ quotes d'instal·lació de fins a 1.200 € \+ costos per mòduls essencials.  
  - *El nostre model:* Tarifa plana per clínica amb facultatius i usuaris il·limitats \+ 0 € d'alta \+ actualitzacions contínues al núvol.

---

### Secció 3: Funcionalitats Clau del Paquet Base

1. **Agenda Multigabinet en Temps Real:**  
   - Visualització simultània per gabinets i facultatius.  
   - Reprogramació fluida per arrossegament (drag-and-drop).  
   - Sincronització instantània (\<500 ms) entre recepció i boxs sense recarregar la pàgina.  
2. **Odontograma Interactiu Vectorial (SVG):**  
   - Dentició adulta (32 peces) i infantil (20 peces) segons estàndard FDI/ISO 3950\.  
   - Topologia de 5 cares interactives independents amb codis de colors clínics.  
   - Històric d'evolució (Estat inicial vs. Estat actual) i connexió directa amb pressupostos.  
3. **Historial Clínic Segur amb Alertes Crítiques:**  
   - Capçalera visible permanent d'alertes mèdiques (al·lèrgies farmacològiques, medicació anticoagulant).  
   - Registre d'evolucions clíniques immutable i compliment estricte de dades sanitàries (Art. 9 RGPD).  
4. **Facturació Fiscal i Caixa Integrada:**  
   - Emissió de pressupostos, factures i tiquets PDF amb codi QR d'alta resolució.  
   - Compliment normatiu natiu: VeriFactu i TicketBAI (Espanya) i adaptació tributària local a LATAM.  
   - Control d'arqueig de caixa diari i gestió de pagaments parcials.

---

### Secció 4: Taula de Preus Transparent (Pricing)

| Pla / Concepte | Europa / Espanya | Llatinoamèrica | Detall d'Inclusió |
| :---- | :---- | :---- | :---- |
| **Pla Base Essencial** | **39 € / mes** | **29 \$ USD / mes** | Clínica completa, **usuaris i facultatius il·limitats**, pacients il·limitats, agenda, odontograma, fitxa clínica i facturació fiscal. 0 € d'alta. |
| **Mòdul Add-on IA WhatsApp** | \+29 € / mes | \+20 \$ USD / mes | Agent conversacional autònom Mastra per confirmació i reprogramació directa de cites al WhatsApp de la clínica. |
| **Mòdul Add-on Firma Digital** | \+15 € / mes | \+10 \$ USD / mes | Signatura biomètrica de consentiments i RGPD a tauleta/mòbil amb plena validesa legal. |
| **Pack Complet** | **69 € / mes** | **49 \$ USD / mes** | Base Essencial \+ IA WhatsApp \+ Firma Digital. |

---

### Secció 5: Seguretat i Sobirania de Dades

- Desplegament en clúster dedicat autogestionat Kubernetes Bare-Metal.  
- Base de dades PostgreSQL amb Row-Level Security (RLS) que garanteix aïllament absolut entre clíniques.  
- Zero dependència de proveïdors de núvol opacs: sobirania total i custòdia estricta de dades sensibles.

---

### Secció 6: Preguntes Freqüents (FAQ)

- **He de pagar més si contracto un nou dentista o higienista?** No. La quota de 39 €/mes inclou tots els usuaris que necessiti la clínica.  
- **Com passo les dades del meu programari antic?** Oferim un servei de migració gratuïta per a pacients, historials i dades bàsiques en menys de 48 hores.  
- **Hi ha permanència?** No, la subscripció és mensual i cancel·lable en qualsevol moment.  
- **El programari compleix amb VeriFactu i TicketBAI?** Sí, l'emissió de factures amb encadenament i codis QR legals està inclosa al pla base.

---

### Secció 7: Footer i CTA Final

- **Titular:** "Dona a la teva clínica la tecnologia que mereix, sense sobrecostos."  
- **Formulari ràpid de registre:** Nom de la clínica, Correu electrònic, Telèfon.  
- **Botó final:** "Activar el meu compte gratuït"