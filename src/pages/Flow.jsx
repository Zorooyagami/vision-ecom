import CustomerJourneyFlow from '../components/CustomerJourneyFlow'
const journeyData = {
  totalSessions: 700,

  journeys: {
    home_direct_add: {
      label:
        "Home → add to cart → view cart → checkout",
      sessionCount: 22,
      percentOfAllSessions: 3.14,
      sampleSessionIds: [
        "c6l1kpwdz4m0lr7z",
        "ojoudhnd5xz09j60",
        "yp0u9osefac0bk5f",
      ],
    },

    plp_direct_add: {
      label:
        "Products page → add to cart → view cart → checkout",
      sessionCount: 2,
      percentOfAllSessions: 0.29,
      sampleSessionIds: [
        "mt1eqju40vz4ja76",
        "mt17rjoa7gd05vg3",
      ],
    },

    full_pdp_funnel: {
      label:
        "Home → products → product detail → add to cart → view cart → checkout",
      sessionCount: 102,
      percentOfAllSessions: 14.57,
      sampleSessionIds: [
        "tilavq64coli47g7",
        "ukqjovthnt4vdpfx",
        "luw2yismu6ljbpxc",
      ],
    },
  },
};

export default function Analytics() {
  return (
    <CustomerJourneyFlow data={journeyData} />
  );
}