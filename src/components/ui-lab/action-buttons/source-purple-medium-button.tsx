import { MediumActionButton, type MediumActionButtonProps } from "./medium-action-button";

const sourcePurpleMediumImages = {
  normal: "/ui-lab/formal-components/assets/buttons/button-source-purple-medium-normal.png",
  hover: "/ui-lab/formal-components/assets/buttons/button-source-purple-medium-hover.png",
  pressed: "/ui-lab/formal-components/assets/buttons/button-source-purple-medium-pressed.png",
};

type SourcePurpleMediumButtonProps = Omit<MediumActionButtonProps, "imageSet">;

export function SourcePurpleMediumButton(props: SourcePurpleMediumButtonProps) {
  return <MediumActionButton {...props} imageSet={sourcePurpleMediumImages} />;
}
