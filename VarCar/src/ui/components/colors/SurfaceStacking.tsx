import * as React from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePaletteStore } from "@/store/palette-store";
import { STEPS, Step, isValidHex, getReadableTextColor, getContrastRatio } from "@colors/color-utils";
import { cn } from "@colors/utils";

/**
 * Calculate root offset label (e.g., "root", "root+1", "root-1")
 */
function getRootOffsetLabel(rootStep: number, currentStep: number): string {
    const rootIndex = STEPS.indexOf(rootStep as Step);
    const currentIndex = STEPS.indexOf(currentStep as Step);
    
    if (rootIndex === -1 || currentIndex === -1) return "";
    
    const offset = currentIndex - rootIndex;
    
    if (offset === 0) return "root";
    if (offset > 0) return `root+${offset}`;
    return `root${offset}`; // negative numbers already have minus sign
}

interface StackingCellProps {
    label: string;
    step: number;
    hex: string;
    surfaceHex: string;
    focusBorderHex?: string;
    rootOffset?: string;
}

function StackingCell({ label, step, hex, surfaceHex, focusBorderHex, rootOffset }: StackingCellProps) {
    const textColor = isValidHex(hex) ? getReadableTextColor(hex) : "#000";
    return (
        <div
            className="flex flex-col items-center justify-center p-1.5 rounded-sm h-14 w-full relative"
            style={{
                backgroundColor: hex,
                ...(focusBorderHex ? {
                    outline: `2px solid ${focusBorderHex}`,
                    outlineOffset: "2px",
                    zIndex: 10
                } : {})
            }}
        >
            <span className="text-[10px] font-medium mb-0.5 opacity-70" style={{ color: textColor }}>{label}</span>
            <span className="text-xs font-mono font-semibold" style={{ color: textColor }}>{step}</span>
            {rootOffset && (
                <span className="text-[8px] font-mono opacity-50 mt-0.5" style={{ color: textColor }}>{rootOffset}</span>
            )}
        </div>
    );
}

interface StackingBlockProps {
    title: string;
    idleStep: number;
    hoverStep: number;
    pressedStep: number;
    focusStep: number;
    paletteSteps: Record<number, string>;
    surfaceHex: string;
    focusBorderHex: string;
    showFocus: boolean;
    idleOffset?: string;
    hoverOffset?: string;
    pressedOffset?: string;
    focusOffset?: string;
}

function StackingBlock({ title, idleStep, hoverStep, pressedStep, focusStep, paletteSteps, surfaceHex, focusBorderHex, showFocus, idleOffset, hoverOffset, pressedOffset, focusOffset }: StackingBlockProps) {
    const textColor = getReadableTextColor(surfaceHex);
    return (
        <div
            className="rounded-lg p-2 space-y-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-md"
            style={{ backgroundColor: surfaceHex }}
        >
            <h4
                className="text-[11px] font-bold tracking-tight uppercase opacity-60 px-1"
                style={{ color: textColor }}
            >
                {title}
            </h4>
            <div className={cn("grid gap-2", showFocus ? "grid-cols-4" : "grid-cols-3")}>
                <StackingCell label="Idle" step={idleStep} hex={paletteSteps[idleStep as Step] || "#ccc"} surfaceHex={surfaceHex} rootOffset={idleOffset} />
                <StackingCell label="hover" step={hoverStep} hex={paletteSteps[hoverStep as Step] || "#ccc"} surfaceHex={surfaceHex} rootOffset={hoverOffset} />
                <StackingCell label="pressed" step={pressedStep} hex={paletteSteps[pressedStep as Step] || "#ccc"} surfaceHex={surfaceHex} rootOffset={pressedOffset} />
                {showFocus && (
                    <StackingCell label="focus" step={focusStep} hex={paletteSteps[focusStep as Step] || "#ccc"} surfaceHex={surfaceHex} focusBorderHex={focusBorderHex} rootOffset={focusOffset} />
                )}
            </div>
        </div>
    );
}

interface StackingSectionProps {
    title: string;
    isLight: boolean;
    activePalette: any;
    baseStep: number;
}

function StackingSection({ title, isLight, activePalette, baseStep }: StackingSectionProps) {
    const [showFocus, setShowFocus] = React.useState(true);
    const bgStep = isLight ? 2500 : 200;
    const sectionBg = activePalette.steps[bgStep];
    const textColor = getReadableTextColor(sectionBg);

    const getIndex = (step: number) => STEPS.indexOf(step as any);
    const getStep = (index: number) => STEPS[Math.max(0, Math.min(STEPS.length - 1, index))];

    const getBoldStepWithContrast = (surfaceStep: Step, primaryStep: Step) => {
        const surfaceHex = activePalette.steps[surfaceStep];
        let currentIndex = getIndex(primaryStep);

        const dir = isLight ? -1 : 1;

        while (currentIndex >= 0 && currentIndex < STEPS.length) {
            const currentStep = STEPS[currentIndex];
            const currentHex = activePalette.steps[currentStep];
            if (getContrastRatio(currentHex, surfaceHex) >= 3.0) {
                return currentStep;
            }
            currentIndex += dir;
        }
        return isLight ? STEPS[0] : STEPS[STEPS.length - 1];
    };

    const getAdjustedBoldStep = (step: number): Step => {
        if (isLight) return step as Step;
        const idx = getIndex(step);
        if (step >= 1900) return step as Step;
        if (step >= 1300) return getStep(idx + 1);
        if (step >= 700) return getStep(idx + 2);
        return getStep(idx + 3);
    };

    const columns = isLight ? [
        { name: "Default", surface: 2500 as Step },
        { name: "Minimal", surface: 2400 as Step },
        { name: "Subtle", surface: 2300 as Step },
        { name: "Bold", surface: activePalette.primaryStep as Step },
        { name: "Elevated", surface: 2500 as Step },
    ] : [
        { name: "Default", surface: 200 as Step },
        { name: "Minimal", surface: 300 as Step },
        { name: "Subtle", surface: 400 as Step },
        { name: "Bold", surface: getAdjustedBoldStep(activePalette.primaryStep) },
        { name: "Elevated", surface: 300 as Step },
    ];

    const minimalSurfaceStep = isLight ? 2400 : 300;
    const subtleSurfaceStep = isLight ? 2300 : 400;
    const minimalHex = activePalette.steps[minimalSurfaceStep as Step];
    const subtleHex = activePalette.steps[subtleSurfaceStep as Step];

    return (
        <div
            className="rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden"
            style={{ backgroundColor: sectionBg }}
        >
            <div
                className="px-6 py-4 border-b flex items-center justify-between"
                style={{
                    borderBottomColor: minimalHex,
                    backgroundColor: subtleHex
                }}
            >
                <h3 className="font-bold text-lg tracking-tight" style={{ color: textColor }}>
                    {title}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium opacity-70" style={{ color: textColor }}>Show Focus</span>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-7 px-2 text-[10px] uppercase tracking-wider font-bold border-0 shadow-sm transition-all",
                            !showFocus && "bg-black/5 hover:bg-black/10"
                        )}
                        style={showFocus ? {
                            backgroundColor: activePalette.steps[getAdjustedBoldStep(activePalette.primaryStep)],
                            color: getReadableTextColor(activePalette.steps[getAdjustedBoldStep(activePalette.primaryStep)])
                        } : { color: textColor }}
                        onClick={() => setShowFocus(!showFocus)}
                    >
                        {showFocus ? "ON" : "OFF"}
                    </Button>
                </div>
            </div>
            <div className="p-4">
                <div className="grid grid-cols-5 gap-3">
                    {columns.map((col) => {
                        const surfaceHex = activePalette.steps[col.surface as Step] || (isLight ? "#fff" : "#000");
                        const surfaceStep = col.surface;

                        let ghostIdle, ghostHover, ghostPressed;
                        let minimalIdle, minimalHover, minimalPressed;
                        let subtleIdle, subtleHover, subtlePressed;
                        let boldIdle, boldHover, boldPressed;

                        const dir = isLight ? -1 : 1;

                        // Root steps for each variant
                        let ghostRoot, minimalRoot, subtleRoot, boldRoot;
                        
                        if (col.name === "Bold") {
                            const surfaceHexVal = activePalette.steps[surfaceStep];
                            const contrast2500 = getContrastRatio(activePalette.steps[2500], surfaceHexVal);
                            const contrast200 = getContrastRatio(activePalette.steps[200], surfaceHexVal);
                            const contrastDir = contrast2500 > contrast200 ? 1 : -1;

                            ghostRoot = surfaceStep;
                            ghostIdle = surfaceStep;
                            ghostHover = getStep(getIndex(ghostIdle) + contrastDir);
                            ghostPressed = getStep(getIndex(ghostHover) + contrastDir);

                            minimalRoot = ghostHover;
                            minimalIdle = ghostHover;
                            minimalHover = getStep(getIndex(minimalIdle) + contrastDir);
                            minimalPressed = getStep(getIndex(minimalHover) + contrastDir);

                            subtleRoot = minimalHover;
                            subtleIdle = minimalHover;
                            subtleHover = getStep(getIndex(subtleIdle) + contrastDir);
                            subtlePressed = getStep(getIndex(subtleHover) + contrastDir);

                            const boldShift = surfaceStep <= 1100 ? 7 : -7;
                            boldRoot = getStep(getIndex(surfaceStep) + boldShift);
                            boldIdle = boldRoot;
                            boldHover = getStep(getIndex(boldIdle) - 1);
                            boldPressed = getStep(getIndex(boldHover) - 1);
                        } else {
                            ghostRoot = surfaceStep;
                            ghostIdle = surfaceStep;
                            ghostHover = getStep(getIndex(ghostIdle) + dir);
                            ghostPressed = getStep(getIndex(ghostIdle) + (dir * 2));

                            minimalRoot = getStep(getIndex(surfaceStep) + dir);
                            minimalIdle = minimalRoot;
                            minimalHover = getStep(getIndex(minimalIdle) + dir);
                            minimalPressed = getStep(getIndex(minimalIdle) + (dir * 2));

                            subtleRoot = getStep(getIndex(surfaceStep) + (dir * 2));
                            subtleIdle = subtleRoot;
                            subtleHover = getStep(getIndex(subtleIdle) + dir);
                            subtlePressed = getStep(getIndex(subtleIdle) + (dir * 2));

                            const adjustedBase = getAdjustedBoldStep(activePalette.primaryStep);
                            if (col.name === "Default" || (col.name === "Elevated" && isLight)) {
                                boldRoot = adjustedBase;
                                boldIdle = adjustedBase;
                            } else {
                                boldRoot = getBoldStepWithContrast(surfaceStep, adjustedBase);
                                boldIdle = boldRoot;
                            }
                            boldHover = getStep(getIndex(boldIdle) - 1);
                            boldPressed = getStep(getIndex(boldHover) - 1);
                        }

                        // Calculate offset labels for each variant
                        const ghostOffsets = {
                            idle: getRootOffsetLabel(ghostRoot, ghostIdle),
                            hover: getRootOffsetLabel(ghostRoot, ghostHover),
                            pressed: getRootOffsetLabel(ghostRoot, ghostPressed),
                            focus: getRootOffsetLabel(ghostRoot, ghostIdle),
                        };
                        
                        const minimalOffsets = {
                            idle: getRootOffsetLabel(minimalRoot, minimalIdle),
                            hover: getRootOffsetLabel(minimalRoot, minimalHover),
                            pressed: getRootOffsetLabel(minimalRoot, minimalPressed),
                            focus: getRootOffsetLabel(minimalRoot, minimalIdle),
                        };
                        
                        const subtleOffsets = {
                            idle: getRootOffsetLabel(subtleRoot, subtleIdle),
                            hover: getRootOffsetLabel(subtleRoot, subtleHover),
                            pressed: getRootOffsetLabel(subtleRoot, subtlePressed),
                            focus: getRootOffsetLabel(subtleRoot, subtleIdle),
                        };
                        
                        const boldOffsets = {
                            idle: getRootOffsetLabel(boldRoot, boldIdle),
                            hover: getRootOffsetLabel(boldRoot, boldHover),
                            pressed: getRootOffsetLabel(boldRoot, boldPressed),
                            focus: getRootOffsetLabel(boldRoot, boldIdle),
                        };

                        return (
                            <div
                                key={col.name}
                                className={cn(
                                    "space-y-3 rounded-xl p-3 transition-all",
                                    col.name === "Elevated" ? "shadow-md ring-1 ring-black/5" : ""
                                )}
                                style={{ backgroundColor: surfaceHex }}
                            >
                                <div className="flex items-center justify-between mb-1 px-1">
                                    <h3 className="text-sm font-bold" style={{ color: getReadableTextColor(surfaceHex) }}>{col.name}</h3>
                                    <span className="text-[10px] font-mono opacity-50" style={{ color: getReadableTextColor(surfaceHex) }}>Step {col.surface}</span>
                                </div>

                                <StackingBlock
                                    title="Ghost"
                                    idleStep={ghostIdle}
                                    hoverStep={ghostHover}
                                    pressedStep={ghostPressed}
                                    focusStep={ghostIdle}
                                    paletteSteps={activePalette.steps}
                                    surfaceHex={surfaceHex}
                                    focusBorderHex={activePalette.steps[boldIdle as Step]}
                                    showFocus={showFocus}
                                    idleOffset={ghostOffsets.idle}
                                    hoverOffset={ghostOffsets.hover}
                                    pressedOffset={ghostOffsets.pressed}
                                    focusOffset={ghostOffsets.focus}
                                />
                                <StackingBlock
                                    title="Minimal"
                                    idleStep={minimalIdle}
                                    hoverStep={minimalHover}
                                    pressedStep={minimalPressed}
                                    focusStep={minimalIdle}
                                    paletteSteps={activePalette.steps}
                                    surfaceHex={surfaceHex}
                                    focusBorderHex={activePalette.steps[boldIdle as Step]}
                                    showFocus={showFocus}
                                    idleOffset={minimalOffsets.idle}
                                    hoverOffset={minimalOffsets.hover}
                                    pressedOffset={minimalOffsets.pressed}
                                    focusOffset={minimalOffsets.focus}
                                />
                                <StackingBlock
                                    title="Subtle"
                                    idleStep={subtleIdle}
                                    hoverStep={subtleHover}
                                    pressedStep={subtlePressed}
                                    focusStep={subtleIdle}
                                    paletteSteps={activePalette.steps}
                                    surfaceHex={surfaceHex}
                                    focusBorderHex={activePalette.steps[boldIdle as Step]}
                                    showFocus={showFocus}
                                    idleOffset={subtleOffsets.idle}
                                    hoverOffset={subtleOffsets.hover}
                                    pressedOffset={subtleOffsets.pressed}
                                    focusOffset={subtleOffsets.focus}
                                />
                                <StackingBlock
                                    title="Bold"
                                    idleStep={boldIdle}
                                    hoverStep={boldHover}
                                    pressedStep={boldPressed}
                                    focusStep={boldIdle}
                                    paletteSteps={activePalette.steps}
                                    surfaceHex={surfaceHex}
                                    focusBorderHex={activePalette.steps[boldIdle as Step]}
                                    showFocus={showFocus}
                                    idleOffset={boldOffsets.idle}
                                    hoverOffset={boldOffsets.hover}
                                    pressedOffset={boldOffsets.pressed}
                                    focusOffset={boldOffsets.focus}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export function SurfaceStacking() {
    const { setViewMode, palettes, activePaletteId, updatePrimaryStep } = usePaletteStore();
    const activePalette = palettes.find(p => p.id === activePaletteId);
    const [primaryOpen, setPrimaryOpen] = React.useState(false);

    if (!activePalette) return null;

    return (
        <div className="flex h-full flex-col bg-background">
            <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setViewMode("palette")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-lg tracking-tight">Surface Stacking — {activePalette.name}</h2>
                    </div>
                </div>

                <Popover open={primaryOpen} onOpenChange={setPrimaryOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs cursor-pointer gap-2"
                        >
                            <span className="text-muted-foreground">Base Color:</span>
                            <span className="font-mono font-bold">{activePalette.primaryStep}</span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[140px] p-1 max-h-64 overflow-y-auto" align="end">
                        <div className="flex flex-col">
                            {STEPS.map((step) => (
                                <button
                                    key={step}
                                    className={cn(
                                        "rounded px-2 py-1.5 text-xs text-left cursor-pointer font-mono",
                                        step === activePalette.primaryStep
                                            ? "bg-accent text-accent-foreground"
                                            : "hover:bg-accent"
                                    )}
                                    onClick={() => {
                                        updatePrimaryStep(activePalette.id, step);
                                        setPrimaryOpen(false);
                                    }}
                                >
                                    {step}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                    <StackingSection
                        title="Light"
                        isLight={true}
                        activePalette={activePalette}
                        baseStep={activePalette.primaryStep}
                    />

                    <StackingSection
                        title="Dark"
                        isLight={false}
                        activePalette={activePalette}
                        baseStep={activePalette.primaryStep}
                    />
                </div>
            </ScrollArea>
        </div>
    );
}
