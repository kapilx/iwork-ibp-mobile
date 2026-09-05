import { colors } from "./colors";

export const gradients = {
  employeeBanner:
    "linear-gradient(94.26deg, #1B5092 0%, #266AB7 36.89%, #1675BC 61.3%, #197087 109.99%)",
  enrollmentBannerBlue:
    "linear-gradient(90deg, #9BE8F6 0%, #67DFE8 99.39%)",
  enrollmentBannerGreen:
    "linear-gradient(90deg, #BBF69B 0%, #ABF086 99.39%)",
  primaryButton:
    "linear-gradient(136.55deg, #2A93FB 12.99%, #4BA4FD 41.03%, #68B4FF 53.7%, #47A2FD 68.47%, #2A93FB 92.72%)",
  summaryCards: [
    {
      bg: `linear-gradient(180deg, ${colors.gradients.purple.start} 0%, ${colors.gradients.purple.end} 100%)`,
      text: colors.gradients.purple.text,
    },
    {
      bg: `linear-gradient(180deg, ${colors.gradients.yellow.start} 0%, ${colors.gradients.yellow.end} 100%)`,
      text: colors.gradients.yellow.text,
    },
    {
      bg: `linear-gradient(180deg, ${colors.gradients.teal.start} 0%, ${colors.gradients.teal.end} 100%)`,
      text: colors.gradients.teal.text,
    },
    {
      bg: `linear-gradient(180deg, ${colors.gradients.orange.start} 0%, ${colors.gradients.orange.end} 100%)`,
      text: colors.gradients.orange.text,
    },
    {
      bg: `linear-gradient(180deg, ${colors.gradients.blue.start} 0%, ${colors.gradients.blue.end} 100%)`,
      text: colors.gradients.blue.text,
    },
    {
      bg: `linear-gradient(180deg, ${colors.gradients.red.start} 0%, ${colors.gradients.red.end} 100%)`,
      text: colors.gradients.red.text,
    },
    {
      bg: `linear-gradient(271.47deg, ${colors.gradients.primaryButton.start} 1.8%, ${colors.gradients.primaryButton.end} 84.06%)`,
    },
    {
      bg: `linear-gradient(271.47deg, ${colors.gradients.primaryButtonHover.start} 1.8%, ${colors.gradients.primaryButtonHover.end} 84.06%)`,
    },
    {
      bg: `linear-gradient(305.94deg, ${colors.gradients.violet.start} 10.22%, ${colors.gradients.violet.end} 130.48%)`,
    },
    {
      bg: `linear-gradient(142.89deg, ${colors.gradients.lightBlue.start} 4.03%, ${colors.gradients.lightBlue.end} 90.1%)`,
    },
    {
      bg: `linear-gradient(307.89deg, ${colors.gradients.lightGreen.start} 5.86%, ${colors.gradients.lightGreen.end} 98.29%)`,
    },
    {
      bg: `linear-gradient(310.91deg, ${colors.gradients.violet.start} 6.66%, ${colors.gradients.violet.end} 98.37%)`,
    },
  ],
  landing: {
    hero: `linear-gradient(135deg, ${colors.landing.primary} 0%, ${colors.landing.primaryLight} 50%, ${colors.landing.teal} 100%)`,
    sectionBackground: `linear-gradient(to bottom, ${colors.landing.overlay}, ${colors.landing.overlayDark})`,
    primaryButton: `linear-gradient(135deg, ${colors.landing.accent} 0%, rgba(255, 107, 53, 0.8) 100%)`,
    secondaryButton: `linear-gradient(135deg, ${colors.landing.primary} 0%, ${colors.landing.secondary} 100%)`,
    secondaryButtonHover: `linear-gradient(135deg, ${colors.landing.primaryDark} 0%, ${colors.landing.secondaryDark} 100%)`,
    tealButton: `linear-gradient(135deg, ${colors.landing.teal} 0%, ${colors.landing.tealLight} 100%)`,
    greenBadge: `linear-gradient(135deg, ${colors.landing.green} 0%, ${colors.landing.greenLight} 100%)`,
    pinkBenefit: `linear-gradient(135deg, ${colors.landing.pink} 0%, ${colors.landing.pinkLight} 100%)`,
    blueBenefit: `linear-gradient(135deg, ${colors.landing.primary} 0%, ${colors.landing.secondary} 100%)`,
    indigoBenefit: `linear-gradient(135deg, ${colors.landing.primary} 0%, ${colors.landing.indigo} 100%)`,
    tealBenefit: `linear-gradient(135deg, ${colors.landing.teal} 0%, ${colors.landing.tealLight} 100%)`,
    greenBenefit: `linear-gradient(135deg, ${colors.landing.green} 0%, ${colors.landing.greenLight} 100%)`,
    placeholderImage: `linear-gradient(135deg, ${colors.landing.primary} 0%, ${colors.landing.teal} 100%)`,
    imageOverlay: `linear-gradient(to top, rgba(31, 121, 212, 0.4), transparent)`,
    actionBanner1: `linear-gradient(135deg, ${colors.landing.primary} 0%, ${colors.landing.secondary} 100%)`,
    actionBanner1Hover: `linear-gradient(135deg, ${colors.landing.primaryDark} 0%, ${colors.landing.secondaryDark} 100%)`,
    actionBanner2: `linear-gradient(135deg, ${colors.landing.teal} 0%, ${colors.landing.tealLight} 100%)`,
    actionBanner2Hover: `linear-gradient(135deg, #00897B 0%, #00ACC1 100%)`,
    actionBanner3: `linear-gradient(135deg, ${colors.landing.green} 0%, ${colors.landing.greenLight} 100%)`,
    actionBanner3Hover: `linear-gradient(135deg, #388E3C 0%, ${colors.landing.green} 100%)`,
  },
};
