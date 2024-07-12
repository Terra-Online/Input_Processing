# Progressive multi-device input processing algorithms framework

## Intro

Mac touchpads, keyboards, mouse (of all kinds), and modern screens have greatly enriched the way people interact, but a significant portion of that interactions has not been handled well.

For example, the Macbook's touchpad comes with a smoothing process, where the user stops touching it and it still swipes at the same speed as the trend for a more subtle animation - however, most of the time on the web side this smoothing effect is just numerous `wheel` events and will simply, wrongly scales the page. When you've searched many blogs and github and can't find a perfect solution, that's frustrating.

## TODO

- Mobile interaction complement;
- Keyboard interaction complement;

## Known Issues

- Current statistical algorithm based on a limited sample size (less than a million samples) is imperfect with a confidence level of about 90% (or lower as no more conditions are verified), and a higher probability of misjudging the input behavior under certain circumstances:
  - short-term auto-smoothing triggered by movement changes of the Touchpad and a small amount of force of the fore-drag (the normal auto-smoothing market is about 1,000ms, with a number of triggers of about 50 times).
- The condition on distinguishing a mouse from a Trackpad are speculative, and for the time being it is not possible to confirm that they will work for most mouse devices (Though, it is almost certainly not possible to distinguish a MagicMouse which is essentially a Trackpad).
