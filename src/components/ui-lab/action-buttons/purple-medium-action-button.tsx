import { MediumActionButton, type MediumActionButtonProps } from "./medium-action-button";

const purpleMediumImages = {
  normal: "/ui-lab/formal-components/assets/buttons/button-purple-medium-normal.png",
  hover: "/ui-lab/formal-components/assets/buttons/button-purple-medium-hover.png",
  pressed: "/ui-lab/formal-components/assets/buttons/button-purple-medium-pressed.png",
};

type PurpleMediumActionButtonProps = Omit<MediumActionButtonProps, "imageSet">;

export function PurpleMediumActionButton(props: PurpleMediumActionButtonProps) {
  return <MediumActionButton {...props} imageSet={purpleMediumImages} />;
}
