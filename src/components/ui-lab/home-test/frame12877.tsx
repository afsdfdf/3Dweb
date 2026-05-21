"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GenerateCtaButton } from "@/components/ui-lab/action-buttons";
import {
    getWorkbenchUploadAccept,
    saveWorkbenchDraft,
    uploadWorkbenchSourceImage,
    validateWorkbenchSourceImage,
} from "@/app/(frontend)/_lib/workbenchDraft";
import styles from "./frame12877.module.css";

type ModeTabsProps = {
    showTextState: boolean;
    onImageMode: () => void;
    onTextMode: () => void;
};

const ModeTabs = ({ showTextState, onImageMode, onTextMode }: ModeTabsProps) => (
    <div
        id="1_3098"
        className={`Pixso-group-1_3098${showTextState ? " Pixso-text-mode-tabs-1_3098" : ""}`}
        role="tablist"
        aria-label="Generation mode"
        onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const visualMidpoint = rect.left - rect.width * 0.1;
            if (event.clientX < visualMidpoint) {
                onImageMode();
                return;
            }
            onTextMode();
        }}
    >
        <div id="1_3099" className="Pixso-group-1_3099">
            <div id="1_3100" className="vector-wrapper-1_3100">
                <div id="1_3100" className="Pixso-vector-1_3100"></div>
            </div>
            <div id="1_3103" className="vector-wrapper-1_3103">
                <div id="1_3103" className="Pixso-vector-1_3103"></div>
            </div>
        </div>
        <button
            id="1_3105"
            className="Pixso-group-1_3105"
            type="button"
            role="tab"
            aria-selected={!showTextState}
            onClick={(event) => {
                event.stopPropagation();
                onImageMode();
            }}
        >
            <div id="1_3106" className="vector-wrapper-1_3106">
                <div id="1_3106" className="Pixso-vector-1_3106"></div>
            </div>
            <span id="1_3113" className="Pixso-paragraph-1_3113">
                {"Image to 3D"}
            </span>
        </button>
        <button
            id="1_3115"
            className="Pixso-group-1_3115"
            type="button"
            role="tab"
            aria-selected={showTextState}
            onClick={(event) => {
                event.stopPropagation();
                onTextMode();
            }}
        >
            <div id="1_3116" className="Pixso-vector-1_3116"></div>
            <span id="1_3117" className="Pixso-paragraph-1_3117">
                {"Text To 3D"}
            </span>
        </button>
    </div>
);
const Frame12877 = () => {
    const router = useRouter();
    const [showProgressState, setShowProgressState] = useState(false);
    const [showTextState, setShowTextState] = useState(false);
    const [showPromptState, setShowPromptState] = useState(false);
    const [showInputState, setShowInputState] = useState(false);
    const [promptEditing, setPromptEditing] = useState(false);
    const [promptText, setPromptText] = useState("");
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
    const isTextMode = showTextState || showPromptState || showInputState;

    useEffect(() => {
        if (promptEditing) {
            promptTextareaRef.current?.focus();
        }
    }, [promptEditing]);

    const handleImageFileChange = (files: FileList | null) => {
        const file = files?.[0];
        if (!file) return;

        try {
            validateWorkbenchSourceImage(file);
            setSelectedImageFile(file);
            setShowProgressState(true);
            setShowTextState(false);
            setShowInputState(false);
            setPromptEditing(false);
        } catch (error) {
            window.alert(error instanceof Error ? error.message : "Image upload failed.");
        }
    };

    const handleGenerate = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            const sourceImageAssets = selectedImageFile ? [await uploadWorkbenchSourceImage(selectedImageFile)] : [];
            const mode = sourceImageAssets.length > 0 ? "image3d" : "text3d";

            saveWorkbenchDraft({
                mode,
                prompt: promptText.trim(),
                sourceImageAssets,
            });

            router.push(`/workbench?mode=${mode}&draft=home`);
        } catch (error) {
            window.alert(error instanceof Error ? error.message : "Generation handoff failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderUploadInput = () => (
        <input
            accept={getWorkbenchUploadAccept()}
            aria-label="Upload reference image"
            className="Pixso-home-upload-input"
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => {
                handleImageFileChange(event.target.files);
                event.target.value = "";
            }}
            type="file"
        />
    );

    return (
        <div className={styles.scope}>
        <div className="scroll-container">
            <div id="1_2877" className="Pixso-frame-1_2877">
                <div id="1_2878" className="Pixso-vector-1_2878"></div>
                <div id="1_2879" className="Pixso-group-1_2879">
                    <div id="1_2880" className="Pixso-group-1_2880">
                        <div id="1_2884" className="vector-wrapper-1_2884">
                            <div
                                id="1_2884"
                                className="Pixso-vector-1_2884"
                            ></div>
                        </div>
                        <div id="1_2885" className="vector-wrapper-1_2885">
                            <div
                                id="1_2885"
                                className="Pixso-vector-1_2885"
                            ></div>
                        </div>
                        <div id="1_2887" className="vector-wrapper-1_2887">
                            <div
                                id="1_2887"
                                className="Pixso-vector-1_2887"
                            ></div>
                        </div>
                        <div
                            id="1_2888"
                            className="Pixso-rectangle-1_2888"
                        ></div>
                        <div id="1_2890" className="Pixso-group-1_2890">
                            <div
                                id="1_2892"
                                className="Pixso-rectangle-1_2892"
                            ></div>
                        </div>
                        <div id="1_2893" className="Pixso-group-1_2893">
                            <div
                                id="1_2895"
                                className="Pixso-rectangle-1_2895"
                            ></div>
                        </div>
                        <div id="1_2896" className="Pixso-vector-1_2896"></div>
                    </div>
                </div>
                <div id="1_3039" className="Pixso-group-1_3039">
                    <GenerateCtaButton
                        className="Pixso-generate-cta-1_3039"
                        disabled={isSubmitting}
                        label={isSubmitting ? "SUBMITTING" : "GENERATE"}
                        onClick={handleGenerate}
                        type="button"
                    />
                </div>
                <ModeTabs
                    showTextState={isTextMode}
                    onImageMode={() => {
                        setShowTextState(false);
                        setShowPromptState(false);
                        setShowInputState(false);
                        setShowProgressState(false);
                        setPromptEditing(false);
                    }}
                    onTextMode={() => {
                        setShowPromptState(true);
                        setShowTextState(false);
                        setShowInputState(false);
                        setShowProgressState(false);
                        setPromptEditing(false);
                    }}
                />
                <div id="1_3119" className="Pixso-group-1_3119">
                    <div id="1_12841" className="Pixso-group-1_12841">
                        <div
                            id="1_3120"
                            className="Pixso-rectangle-1_3120"
                        ></div>
                        <div
                            id="1_12842"
                            className="Pixso-rectangle-1_12842"
                        ></div>
                    </div>
                </div>
                <div id="1_3122" className="Pixso-group-1_3122">
                    <div id="1_3123" className="Pixso-rectangle-1_3123"></div>
                </div>
                <div id="1_3125" className="Pixso-group-1_3125">
                    <div
                        id="1_12778"
                        className="Pixso-group-1_12778"
                        style={{ left: 541, top: 44 }}
                    >
                        <div
                            id="1_3216"
                            className="Pixso-rectangle-1_3216"
                            style={{ opacity: 0.1 }}
                        ></div>
                        <div
                            id="1_12779"
                            className="Pixso-rectangle-1_12779"
                        ></div>
                    </div>
                    <div id="1_12889" className="Pixso-group-1_12889">
                        <div
                            id="1_3217"
                            className="Pixso-rectangle-1_3217"
                        ></div>
                        <div
                            id="1_12890"
                            className="Pixso-rectangle-1_12890"
                        ></div>
                    </div>
                    <div id="1_3218" className="Pixso-rectangle-1_3218"></div>
                    <div id="1_3219" className="Pixso-group-1_3219">
                        <p id="1_3220" className="Pixso-paragraph-1_3220">
                            {"ideas to Full-color Custom Miniatures"}
                        </p>
                        <div id="1_3222" className="Pixso-vector-1_3222"></div>
                        <div id="1_3223" className="Pixso-vector-1_3223"></div>
                    </div>
                </div>
                <div
                    id="1_3253"
                    className={`Pixso-group-1_3253${showProgressState || showTextState || showPromptState || showInputState ? " Pixso-state-hidden" : ""}`}
                >
                    <div id="1_3254" className="vector-wrapper-1_3254">
                        <div id="1_3254" className="Pixso-vector-1_3254"></div>
                    </div>
                    <label
                        id="1_3255"
                        className="vector-wrapper-1_3255"
                        onClick={() => {
                            setShowProgressState(true);
                            setShowTextState(false);
                            setShowPromptState(false);
                            setShowInputState(false);
                            setPromptEditing(false);
                        }}
                    >
                        <div id="1_3255" className="Pixso-vector-1_3255"></div>
                        {renderUploadInput()}
                    </label>
                    <div id="1_3256" className="Pixso-vector-1_3256"></div>
                    <div id="1_3264" className="Pixso-group-1_3264">
                        <p id="1_3265" className="Pixso-paragraph-1_3265">
                            {"Add Image"}
                        </p>
                        <div id="1_3266" className="Pixso-vector-1_3266"></div>
                    </div>
                    <div id="1_3271" className="Pixso-vector-1_3271"></div>
                    <div id="1_3272" className="Pixso-vector-1_3272"></div>
                </div>
                {showProgressState && (
                    <div id="1_4372" className="Pixso-group-1_4372 Pixso-progress-state-1_4372">
                        <div id="1_4373" className="Pixso-group-1_4373">
                            <div id="1_4374" className="vector-wrapper-1_4374">
                                <div
                                    id="1_4374"
                                    className="Pixso-vector-1_4374"
                                ></div>
                            </div>
                            <div id="1_4375" className="vector-wrapper-1_4375">
                                <div
                                    id="1_4375"
                                    className="Pixso-vector-1_4375"
                                ></div>
                            </div>
                            <div id="1_4376" className="Pixso-vector-1_4376"></div>
                            <div id="1_4377" className="Pixso-group-1_4377">
                                <div
                                    id="1_4379"
                                    className="Pixso-rectangle-1_4379"
                                ></div>
                            </div>
                            <div id="1_4380" className="Pixso-group-1_4380">
                                <div
                                    id="1_4382"
                                    className="Pixso-rectangle-1_4382"
                                ></div>
                            </div>
                            <div id="1_4383" className="Pixso-group-1_4383">
                                <div id="1_4384" className="stroke-wrapper-1_4384">
                                    <div className="Pixso-rectangle-1_4384"></div>
                                    <div className="stroke-1_4384"></div>
                                </div>
                                <div
                                    id="1_4385"
                                    className="Pixso-vector-1_4385"
                                ></div>
                            </div>
                            <div id="1_4386" className="Pixso-group-1_4386">
                                <div id="1_4387" className="stroke-wrapper-1_4387">
                                    <div className="Pixso-rectangle-1_4387"></div>
                                    <div className="stroke-1_4387"></div>
                                </div>
                                <div
                                    id="1_4388"
                                    className="Pixso-vector-1_4388"
                                ></div>
                            </div>
                            <div id="1_4389" className="Pixso-group-1_4389">
                                <div id="1_4390" className="stroke-wrapper-1_4390">
                                    <div className="Pixso-rectangle-1_4390"></div>
                                    <div className="stroke-1_4390"></div>
                                </div>
                                <div
                                    id="1_4391"
                                    className="Pixso-vector-1_4391"
                                ></div>
                            </div>
                            <div id="1_4392" className="Pixso-group-1_4392">
                                <p id="1_4394" className="Pixso-paragraph-1_4394">
                                    {"25%"}
                                </p>
                                <div id="1_4395" className="Pixso-group-1_4395">
                                    <div
                                        id="1_4396"
                                        className="Pixso-rectangle-1_4396"
                                    ></div>
                                    <div
                                        id="1_4397"
                                        className="Pixso-rectangle-1_4397"
                                    ></div>
                                </div>
                            </div>
                            <div id="1_4405" className="Pixso-group-1_4405">
                                <p id="1_4406" className="Pixso-paragraph-1_4406">
                                    {"Add Image"}
                                </p>
                                <div
                                    id="1_4407"
                                    className="Pixso-vector-1_4407"
                                ></div>
                                {renderUploadInput()}
                            </div>
                            <div id="1_4412" className="Pixso-vector-1_4412"></div>
                        </div>
                    </div>
                )}
                {showPromptState && (
                    <div
                        id="1_9819"
                        className="Pixso-group-1_9819 Pixso-prompt-state-1_9819"
                    >
                        <div id="1_9820" className="vector-wrapper-1_9820">
                            <div id="1_9820" className="Pixso-vector-1_9820"></div>
                        </div>
                            <div id="1_9821" className="Pixso-group-1_9821">
                            <div id="1_9822" className="vector-wrapper-1_9822">
                                <div
                                    id="1_9822"
                                    className="Pixso-vector-1_9822"
                                ></div>
                            </div>
                            <textarea
                                ref={promptTextareaRef}
                                className={`Pixso-prompt-textarea-1_9822${promptEditing ? " Pixso-prompt-textarea-active-1_9822" : ""}`}
                                aria-label="Prompt"
                                placeholder="Please enter prompt …"
                                value={promptText}
                                onFocus={() => setPromptEditing(true)}
                                onChange={(event) => setPromptText(event.target.value)}
                            />
                            <p
                                id="1_9823"
                                className={`Pixso-paragraph-1_9823${promptEditing ? " Pixso-prompt-placeholder-hidden-1_9823" : ""}`}
                            >
                                {"Please enter prompt …"}
                            </p>
                            <div
                                id="1_9824"
                                className={`Pixso-group-1_9824${promptEditing ? " Pixso-prompt-placeholder-hidden-1_9824" : ""}`}
                            >
                                <div
                                    id="1_9825"
                                    className="Pixso-vector-1_9825"
                                ></div>
                                <div
                                    id="1_9832"
                                    className="Pixso-vector-1_9832"
                                ></div>
                                <div
                                    id="1_9833"
                                    className="Pixso-vector-1_9833"
                                ></div>
                                <div
                                    id="1_9839"
                                    className="Pixso-vector-1_9839"
                                ></div>
                                <div
                                    id="1_9846"
                                    className="Pixso-vector-1_9846"
                                ></div>
                                <div
                                    id="1_9847"
                                    className="Pixso-vector-1_9847"
                                ></div>
                                <div
                                    id="1_9848"
                                    className="Pixso-rectangle-1_9848"
                                ></div>
                            </div>
                            <div
                                id="1_9849"
                                className="Pixso-vector-1_9849"
                                onClick={() => {
                                    setShowPromptState(false);
                                    setShowTextState(true);
                                    setShowInputState(false);
                                    setShowProgressState(false);
                                    setPromptEditing(false);
                                }}
                            ></div>
                            <div id="1_9850" className="Pixso-group-1_9850">
                                <p id="1_9851" className="Pixso-paragraph-1_9851">
                                    {"Add Image"}
                                </p>
                                <div
                                    id="1_9852"
                                    className="Pixso-vector-1_9852"
                                ></div>
                                {renderUploadInput()}
                            </div>
                            <div id="1_9857" className="Pixso-vector-1_9857"></div>
                        </div>
                    </div>
                )}
                {showInputState && (
                    <div id="1_10406" className="Pixso-group-1_10406 Pixso-filled-text-state-1_10406">
                    <div id="1_10407" className="Pixso-group-1_10407">
                        <div id="1_10408" className="vector-wrapper-1_10408">
                            <div
                                id="1_10408"
                                className="Pixso-vector-1_10408"
                            ></div>
                        </div>
                        <div id="1_10409" className="Pixso-group-1_10409">
                            <div
                                id="1_10410"
                                className="vector-wrapper-1_10410"
                            >
                                <div
                                    id="1_10410"
                                    className="Pixso-vector-1_10410"
                                ></div>
                            </div>
                            <div id="1_10411" className="Pixso-group-1_10411">
                                <p
                                    id="1_10413"
                                    className="Pixso-paragraph-1_10413"
                                >
                                    {
                                        "A majestic red dragon in a dynamic pose, with its full wings completely visible and uncropped, the entire dragon is fully visible in the frame, set against a clean white background, fantasy art style, "
                                    }
                                </p>
                            </div>
                            <div
                                id="1_10414"
                                className="Pixso-vector-1_10414"
                            ></div>
                            <div
                                id="1_10415"
                                className="Pixso-vector-1_10415"
                            ></div>
                            <div id="1_10416" className="Pixso-group-1_10416">
                                <div
                                    id="1_10417"
                                    className="Pixso-vector-1_10417"
                                ></div>
                                <div
                                    id="1_10424"
                                    className="Pixso-vector-1_10424"
                                ></div>
                                <div
                                    id="1_10425"
                                    className="Pixso-vector-1_10425"
                                ></div>
                                <div
                                    id="1_10431"
                                    className="Pixso-vector-1_10431"
                                ></div>
                                <div
                                    id="1_10438"
                                    className="Pixso-vector-1_10438"
                                ></div>
                                <div
                                    id="1_10439"
                                    className="Pixso-vector-1_10439"
                                ></div>
                                <div
                                    id="1_10440"
                                    className="Pixso-rectangle-1_10440"
                                ></div>
                            </div>
                            <div
                                id="1_10441"
                                className="Pixso-vector-1_10441"
                            ></div>
                            <div id="1_10442" className="Pixso-group-1_10442" onClick={() => {
                                setShowTextState(true);
                                setShowInputState(false);
                                setShowPromptState(false);
                                setShowProgressState(false);
                                setPromptEditing(false);
                            }}>
                                <p
                                    id="1_10443"
                                    className="Pixso-paragraph-1_10443"
                                >
                                    {"Add Image"}
                                </p>
                                <div
                                    id="1_10444"
                                    className="Pixso-vector-1_10444"
                                ></div>
                                {renderUploadInput()}
                            </div>
                            <div
                                id="1_10449"
                                className="Pixso-vector-1_10449"
                            ></div>
                        </div>
                    </div>
                    <div id="1_10457" className="Pixso-group-1_10457">
                        <div id="1_10458" className="Pixso-text-1_10458">
                            <p
                                id="1_10458_0"
                                className="Pixso-paragraph-1_10458_0"
                            >
                                <span
                                    id="1_10458_0_1"
                                    className="Pixso-span-1_10458_0_1"
                                >
                                    {"Go get your 3D "}
                                </span>
                            </p>
                            <p
                                id="1_10458_1"
                                className="Pixso-paragraph-1_10458_1"
                            >
                                <span
                                    id="1_10458_1_1"
                                    className="Pixso-span-1_10458_1_1"
                                >
                                    {"model"}
                                </span>
                            </p>
                        </div>
                        <div
                            id="1_10459"
                            className="Pixso-vector-1_10459"
                        ></div>
                        <div
                            id="1_10460"
                            className="Pixso-vector-1_10460"
                        ></div>
                    </div>
                    <div id="1_10462" className="Pixso-group-1_10462">
                        <div id="1_10463" className="Pixso-text-1_10463">
                            <p
                                id="1_10463_0"
                                className="Pixso-paragraph-1_10463_0"
                            >
                                <span
                                    id="1_10463_0_1"
                                    className="Pixso-span-1_10463_0_1"
                                >
                                    {"Click Here To "}
                                </span>
                            </p>
                            <p
                                id="1_10463_1"
                                className="Pixso-paragraph-1_10463_1"
                            >
                                <span
                                    id="1_10463_1_1"
                                    className="Pixso-span-1_10463_1_1"
                                >
                                    {"Upload Text"}
                                </span>
                            </p>
                        </div>
                        <div
                            id="1_10464"
                            className="Pixso-vector-1_10464"
                        ></div>
                        <div
                            id="1_10465"
                            className="Pixso-vector-1_10465"
                        ></div>
                    </div>
                </div>
                )}
                {showTextState && (
                    <div id="1_4953" className="Pixso-group-1_4953 Pixso-text-state-1_4953">
                        <div
                            id="1_4954"
                            className="Pixso-group-1_4954"
                            onClick={() => {
                                setShowInputState(true);
                                setShowTextState(false);
                                setShowPromptState(false);
                                setShowProgressState(false);
                                setPromptEditing(false);
                            }}
                        >
                            <div id="1_4955" className="vector-wrapper-1_4955">
                                <div
                                    id="1_4955"
                                    className="Pixso-vector-1_4955"
                                ></div>
                            </div>
                            <div id="1_4956" className="Pixso-group-1_4956">
                                <div id="1_4957" className="vector-wrapper-1_4957">
                                    <div
                                        id="1_4957"
                                        className="Pixso-vector-1_4957"
                                    ></div>
                                </div>
                                <div
                                    id="1_4958"
                                    className="Pixso-vector-1_4958"
                                ></div>
                                <div id="1_4966" className="Pixso-group-1_4966">
                                    <p
                                        id="1_4967"
                                        className="Pixso-paragraph-1_4967"
                                    >
                                        {"Add Text"}
                                    </p>
                                    <div
                                        id="1_4968"
                                        className="Pixso-vector-1_4968"
                                    ></div>
                                </div>
                                <div
                                    id="1_4973"
                                    className="Pixso-vector-1_4973"
                                ></div>
                                <div id="1_4989" className="Pixso-group-1_4989">
                                    <div
                                        id="1_4990"
                                        className="Pixso-vector-1_4990"
                                    ></div>
                                    <div
                                        id="1_4997"
                                        className="Pixso-vector-1_4997"
                                    ></div>
                                    <div
                                        id="1_4998"
                                        className="Pixso-vector-1_4998"
                                    ></div>
                                    <div
                                        id="1_5004"
                                        className="Pixso-vector-1_5004"
                                    ></div>
                                    <div
                                        id="1_5011"
                                        className="Pixso-vector-1_5011"
                                    ></div>
                                    <div
                                        id="1_5012"
                                        className="Pixso-vector-1_5012"
                                    ></div>
                                    <div
                                        id="1_5013"
                                        className="Pixso-rectangle-1_5013"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {isTextMode && (
                    <>
                        <div
                            className="Pixso-text-mode-guide Pixso-text-mode-get-model-guide"
                            aria-hidden="true"
                        >
                            <img
                                alt=""
                                decoding="async"
                                src="/home-test-assets/images/text-mode-get-model-guide.png"
                            />
                        </div>
                        <div
                            className="Pixso-text-mode-guide Pixso-text-mode-upload-text-guide"
                            aria-hidden="true"
                        >
                            <img
                                alt=""
                                decoding="async"
                                src="/home-test-assets/images/text-mode-upload-text-guide.png"
                            />
                        </div>
                    </>
                )}
                <div id="1_3287" className={`Pixso-group-1_3287${isTextMode ? " Pixso-state-hidden" : ""}`}>
                    <div id="1_3288" className="Pixso-text-1_3288">
                        <p id="1_3288_0" className="Pixso-paragraph-1_3288_0">
                            <span
                                id="1_3288_0_1"
                                className="Pixso-span-1_3288_0_1"
                            >
                                {"Click Here To "}
                            </span>
                        </p>
                        <p id="1_3288_1" className="Pixso-paragraph-1_3288_1">
                            <span
                                id="1_3288_1_1"
                                className="Pixso-span-1_3288_1_1"
                            >
                                {"Upload Image"}
                            </span>
                        </p>
                    </div>
                    <div id="1_3289" className="Pixso-vector-1_3289"></div>
                    <div id="1_3290" className="Pixso-vector-1_3290"></div>
                </div>
                <div id="1_3292" className={`Pixso-group-1_3292${isTextMode ? " Pixso-state-hidden" : ""}`}>
                    <div id="1_3293" className="Pixso-text-1_3293">
                        <p id="1_3293_0" className="Pixso-paragraph-1_3293_0">
                            <span
                                id="1_3293_0_1"
                                className="Pixso-span-1_3293_0_1"
                            >
                                {"Go get your 3D "}
                            </span>
                        </p>
                        <p id="1_3293_1" className="Pixso-paragraph-1_3293_1">
                            <span
                                id="1_3293_1_1"
                                className="Pixso-span-1_3293_1_1"
                            >
                                {"model"}
                            </span>
                        </p>
                    </div>
                    <div id="1_3294" className="Pixso-vector-1_3294"></div>
                    <div id="1_3295" className="Pixso-vector-1_3295"></div>
                </div>
            </div>
        </div>
        </div>
    );
};
export default Frame12877;
