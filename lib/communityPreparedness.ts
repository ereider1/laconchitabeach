export type CommunityPreparednessContent = {
  eyebrow: string; title: string; intro: string; historyTitle: string; historyParagraphs: string[];
  concernsTitle: string; concernsParagraphs: string[]; warning: string; rainfallTitle: string;
  rainfallIntro: string; rainfallThresholds: string[]; contactsTitle: string; contacts: string[];
  resourcesTitle: string; resources: Array<{ title: string; subtitle: string; url: string }>;
};

export const defaultCommunityPreparednessContent: CommunityPreparednessContent = {
  eyebrow: "town hall", title: "Community preparedness",
  intro: "Understanding La Conchita's hillside, rainfall patterns, and emergency resources helps us stay ready together.",
  historyTitle: "History of a hillside",
  historyParagraphs: ["La Conchita's hillside has been active for thousands of years. Long before the area was first settled in the 1920s, slide activity had been commonly reported in the press since 1865. Major slide events in 1889 and 1909 interrupted railroad service along the coast.", "Modern studies show the bluff is part of an ancient, slow-moving landslide system that can become unstable after periods of heavy rain."],
  concernsTitle: "Ongoing concerns",
  concernsParagraphs: ["The potential for landslide and debris flow activity continues to be a concern, particularly when wet weather patterns are anticipated. Situational awareness is key. Land movement indicators include changes in hillside appearance, loud noises, cracks, bulging at the base, leaning trees, and water drainage."],
  warning: "If the situation looks or feels dangerous…LEAVE!",
  rainfallTitle: "Rainfall thresholds", rainfallIntro: "Stay alert when it rains. Historically, these thresholds are linked to land movement:",
  rainfallThresholds: ["1 inch of rain per hour", "8 inches of rain within two weeks", "15 inches of rain within 30 days"],
  contactsTitle: "Key contacts & hotlines",
  contacts: ["Incident Information Hotline:\n(805) 465-6650", "Sheriff Emergency Services Business Line:\n(805) 322-4679", "VC Alert Help / Registration:\nRegister online via Ready Ventura County or call (888) 772-4482.", "Ventura County Fire Department:\n(805) 389-9710"],
  resourcesTitle: "Resources",
  resources: [{ title: "Get Ready, Stay Ready", subtitle: "Ready Ventura County", url: "https://readyventuracounty.org" }, { title: "Stay Informed", subtitle: "VC Alert emergency notifications", url: "https://vcalert.org" }, { title: "Emergency information", subtitle: "Ventura County emergency services", url: "https://vcemergency.com" }],
};
