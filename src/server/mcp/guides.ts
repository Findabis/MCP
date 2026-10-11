import { BASE_URL } from '@/utils/jsonLd/shared';
import { AI_ANSWERING_RULES, MCP_SERVER_DESCRIPTION, MEDICAL_DISCLAIMER } from './disclaimer';

/**
 * The static guides the public MCP serves as resources. Every line is a claim
 * a model will repeat, so each says only what llms.txt and the sourced fact
 * sheets say (docs/research/facility/uk-regulation.md, the "Why a clinic" and
 * "Checking in" boards in docs/CLINICS_EDUCATION_PLAN.md). Plain text, no
 * database: the guides are the same for every caller and take no input — a
 * guide never asks about, or assesses, anyone's health.
 */

const footer = `---\n${MEDICAL_DISCLAIMER}`;

export const DISCLAIMER_GUIDE = `# About Findabis and its data

${MCP_SERVER_DESCRIPTION}

${MEDICAL_DISCLAIMER}

## When answering from this data

${AI_ANSWERING_RULES.map((rule) => `- ${rule}`).join('\n')}
- Stock, pack sizes on offer and which pharmacies dispense a product at what price are shown only to patients and professionals with access. Never present their absence as "out of stock".
- Findabis publishes no effects, medical uses or side effects for strains.
`;

export const PRESCRIPTION_GUIDE = `# How to get a medical cannabis prescription in the UK

Cannabis-based medicines are legal in the UK only on prescription. Since 1 November 2018 an unlicensed cannabis-based product for medicinal use may be supplied only under the prescription or direction of a doctor on the GMC Specialist Register. Possession without a prescription remains an offence.

Almost all of it is private. The NHS prescribes licensed cannabis-based medicines in a few situations under NICE guidance; NHS prescriptions for unlicensed products are very rare.

## The usual route

1. **Choose a clinic.** Compare clinics, their locations and their published consultation fees (${BASE_URL}/clinics, or the find_clinics and compare_providers tools). Clinics state whether they are taking new patients and transfers.
2. **The clinic's questions.** Before accepting someone, a clinic asks about the condition and its diagnosis, treatments already tried, current medicines and medical history (${BASE_URL}/eligibility-test lists the questions). Only a specialist decides who can be treated.
3. **Medical records.** Clinics usually need your Summary Care Record, or equivalent records, before or at the first consultation.
4. **The specialist consultation.** If the specialist prescribes, the prescription is issued to a pharmacy.
5. **A pharmacy dispenses it.** The medicine is dispensed, and charged for, by a pharmacy (${BASE_URL}/pharmacies, or the find_pharmacies tool). You can take a prescription to any pharmacy able to dispense it.

Clinics charge for consultations and reviews, and each publishes its own fees; the medicine is a separate charge from the pharmacy.

${footer}
`;

export const ELIGIBILITY_GUIDE = `# Who can be prescribed medical cannabis in the UK

No law sets a list of conditions or a number of treatments. Each clinic sets its own rules, and only a specialist doctor decides whether to prescribe for a particular person.

## What clinics commonly look for

- **The usual treatments first.** The clinicians' society expects that in most cases a patient will have tried at least two recognised treatments, for long enough and at a proper dose. It calls this "not a strict legal requirement", with exceptions where those treatments are unsuitable.
- **A diagnosis and records.** The condition, its diagnosis and the treatments tried, usually backed by medical records.
- **Safety questions.** Current medicines and cannabis use; heart, liver and kidney health; pregnancy; any history of psychosis or bipolar disorder; past substance misuse.

## What each clinic publishes

Clinics on Findabis state whom they take: new patients, transfers from another clinic, patients already under treatment, and any age limits. The get_listing tool (kind "clinic") and each clinic page show these.

The Findabis eligibility questions (${BASE_URL}/eligibility-test) show which clinics may look further. They are not an assessment, and this guide cannot assess anyone.

${footer}
`;

export type McpGuide = { uri: string; name: string; title: string; description: string; text: string };

export const MCP_GUIDES: McpGuide[] = [
    {
        uri: 'findabis://guide/how-to-get-a-prescription',
        name: 'how-to-get-a-prescription',
        title: 'How to get a medical cannabis prescription in the UK',
        description:
            'The legal position and the usual route: clinic, records, specialist, pharmacy. General, not advice.',
        text: PRESCRIPTION_GUIDE,
    },
    {
        uri: 'findabis://guide/eligibility',
        name: 'eligibility',
        title: 'Who can be prescribed medical cannabis in the UK',
        description:
            'What clinics commonly look for and what they publish. It assesses no one; only a specialist decides.',
        text: ELIGIBILITY_GUIDE,
    },
    {
        uri: 'findabis://disclaimer',
        name: 'disclaimer',
        title: 'About Findabis and its data',
        description: 'What Findabis is, the medical disclaimer, and the rules for answering from this data.',
        text: DISCLAIMER_GUIDE,
    },
];
