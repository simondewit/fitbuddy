import { render, screen } from '@testing-library/react-native';

import { Avatar } from '../Avatar';
import { avatarParams } from '../params';

describe('avatarParams', () => {
  it('blij bij hoge score: lach, blosjes, geen wallen of zweet', () => {
    const p = avatarParams(0.95);
    expect(p.smile).toBeGreaterThan(0.55);
    expect(p.blush).toBeGreaterThan(0.9);
    expect(p.bags).toBe(0);
    expect(p.sweat).toBe(0);
    expect(p.tired).toBe(0);
  });

  it('uitgeput bij lage score: frons, oogleden, wallen, zweet, wilde haren', () => {
    const p = avatarParams(0.1);
    expect(p.smile).toBeLessThan(0);
    expect(p.tired).toBeGreaterThan(0.4);
    expect(p.bags).toBe(1);
    expect(p.sweat).toBe(1);
    expect(p.stray).toBe(1);
    expect(p.wrinkles).toBeGreaterThan(0.9);
  });

  it('verandert traploos', () => {
    const a = avatarParams(0.5).smile;
    const b = avatarParams(0.51).smile;
    expect(b - a).toBeGreaterThan(0);
    expect(b - a).toBeLessThan(0.05);
  });

  it('kapt waarden buiten 0..1 af', () => {
    expect(avatarParams(-3)).toEqual(avatarParams(0));
    expect(avatarParams(7)).toEqual(avatarParams(1));
  });

  it('ademt sneller bij een hoge score', () => {
    expect(avatarParams(1).breatheSeconds).toBeLessThan(avatarParams(0).breatheSeconds);
  });
});

describe('<Avatar />', () => {
  it('rendert met een toegankelijke omschrijving', async () => {
    await render(<Avatar health={0.9} animated={false} />);
    expect(screen.getByLabelText(/Pip, straalt/)).toBeTruthy();
  });
});
