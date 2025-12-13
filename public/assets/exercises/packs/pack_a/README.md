# Exercise Demo Pack A - Style Guide

## Visual Requirements

All animations in this pack must follow these strict style guidelines to maintain a premium, consistent look:

### View & Perspective
- **Side-view only**: All exercises must be shown from the side (profile view)
- Consistent camera angle across all animations

### Line Style
- **Uniform line thickness**: All strokes must use the same weight (4px recommended)
- Consistent stroke style (solid, no dashes)

### Animation Tempo
- **Consistent frame rate**: All animations use 30fps
- **Similar timing**: Exercise cycles should feel similar in duration
- Smooth, natural motion curves

### Background
- **Transparent background**: No background color or fill
- Clean, minimal presentation

### Scale & Proportions
- **Consistent scale**: Body fills approximately 60-70% of the frame
- **Uniform proportions**: Stick figure style with consistent body part ratios
- Head, torso, limbs maintain same relative sizes across all exercises

### Color
- **Single color scheme**: White (#FFFFFF) strokes on transparent background
- No gradients or color variations

## Technical Requirements

- Format: Lottie JSON
- Version: 5.7.4+
- Dimensions: 400x400px recommended
- Loop: All animations should loop seamlessly

## Validation

**All assets must pass validation before commit:**

```bash
npm run validate:lottie
```

This script validates that all JSON files are valid JSON and won't crash the display. The build will fail if any file is invalid.

## Quality Checklist

Before adding a new animation to this pack, verify:
- [ ] Side-view perspective
- [ ] Same line thickness as existing animations
- [ ] 30fps frame rate
- [ ] Transparent background
- [ ] Body fills 60-70% of frame
- [ ] Consistent proportions with pack_a style
- [ ] White strokes only
- [ ] Seamless loop
- [ ] Passes `npm run validate:lottie`

