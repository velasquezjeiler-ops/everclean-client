      <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Sanitary units</p>
                  <p className="text-xs text-gray-400 mb-3">Each additional toilet +$15, each urinal +$12</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Toilets / stalls</p>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setToilets(t => Math.max(1, t - 1))}
                          className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">−</button>
                        <span className="w-8 text-center font-semibold text-gray-900">{toilets}</span>
                        <button type="button" onClick={() => setToilets(t => t + 1)}
                          className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">+</button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Urinals</p>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setUrinals(u => Math.max(0, u - 1))}
                          className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">−</button>
                        <span className="w-8 text-center font-semibold text-gray-900">{urinals}</span>
                        <button type="button" onClick={() => setUrinals(u => u + 1)}
                          className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">+</button>
                      </div>
                    </div>
                  </div>
                  {(toilets > 1 || urinals > 0) && (
                    <div className="mt-3 bg-amber-50 rounded-lg p-2 text-xs text-amber-700">
                      Sanitary surcharge: +${bathroomSurcharge(toilets, urinals)}
                      {' '}({toilets > 1 ? `${toilets - 1} extra toilet${toilets > 2 ? 's' : ''}` : ''}
                      {urinals > 0 ? `${toilets > 1 ? ', ' : ''}${urinals} urinal${urinals > 1 ? 's' : ''}` : ''})
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Date */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <label className="text-sm text-gray-600 block mb-1">Preferred date & time</label>
              <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
              <p className="text-xs text-gray-400 mt-1">Professional confirms exact time within ±2h window</p>
            </div>

            {/* Live quote */}
            {Number(activeSqft) > 0 && (
              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                <p className="text-xs font-semibold text-emerald-700 mb-3 uppercase tracking-wide">Your quote</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-emerald-700">
                    <span>{activeSqft} sqft × ${RATES[serviceType]?.sqftRate}/sqft</span>
                    <span>${Math.round(Number(activeSqft) * RATES[serviceType]?.sqftRate)}</span>
                  </div>
                  {price.base > Math.round(Number(activeSqft) * RATES[serviceType]?.sqftRate) && (
                    <div className="flex justify-between text-amber-600 text-xs">
                      <span>Minimum visit charge applied</span>
                      <span>${price.base}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>Estimated hours</span>
                    <span>{price.hours}h</span>
                  </div>
                  {price.bathroomFee > 0 && (
                    <div className="flex justify-between text-amber-600 text-xs">
                      <span>Sanitary units surcharge</span>
                      <span>+${price.bathroomFee}</span>
                    </div>
                  )}
                  {price.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 text-xs">
                      <span>Recurring discount ({Math.round((FREQ_DISCOUNTS[frequency]?.discount || 0) * 100)}%)</span>
                      <span>-${price.discount}</span>
                    </div>
                  )}
                  {price.addonsTotal > 0 && (
                    <div className="flex justify-between text-gray-600 text-xs">
                      <span>Add-ons</span>
                      <span>+${price.addonsTotal}</span>
                    </div>
                  )}
                  {price.petFee > 0 && (
                    <div className="flex justify-between text-gray-600 text-xs">
                      <span>Pet-safe products</span>
                      <span>+${price.petFee}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-emerald-800 text-base pt-2 border-t border-emerald-200">
                    <span>Total</span>
                    <span>${price.total}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Add-ons (residential only) */}
            {isResidential && (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h2 className="text-sm font-medium text-gray-700 mb-1">Add-on services</h2>
                  <p className="text-xs text-gray-400 mb-3">Optional extras · priced transparently</p>
                  <div className="space-y-2">
                    {ADDONS.map(addon => (
                      <label key={addon.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${addons.includes(addon.id) ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={addons.includes(addon.id)} onChange={() => toggleAddon(addon.id)} className="w-4 h-4 accent-emerald-600" />
                          <span className="text-lg">{addon.icon}</span>
                          <span className="text-sm text-gray-700">{addon.label}</span>
                        </div>
                        <span className="text-sm font-medium text-emerald-700">+${addon.price}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-medium text-gray-700">Pets at home?</h2>
                      <p className="text-xs text-gray-400">Pet-safe products · +$20</p>
                    </div>
                    <button type="button" onClick={() => setHasPets(!hasPets)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${hasPets ? 'bg-emerald-50 text-emerald-700 border-emerald-400' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {hasPets ? '🐾 Yes' : 'No pets'}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-sm text-gray-600 block mb-1">Special instructions (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Access code, areas to focus on, allergies..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 h-16 resize-none" />
            </div>

            <button type="button"
              onClick={() => setStep(3)}
              disabled={!scheduledAt || (!sqft && !commercialSqft)}
              className="w-full bg-emerald-700 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50 transition-all">
              Continue to address →
            </button>
          </div>
        )}

        {/* ── STEP 3: Address ── */}
        {step === 3 && (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold text-gray-900">Service address</h1>

            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Street address</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="123 Main St"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">City</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)}
                    placeholder="Newark"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">State</label>
                  <select value={state} onChange={e => setState(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {['NJ','NY','CT','PA','FL','TX','CA'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
              <p className="text-xs font-semibold text-emerald-700 mb-3 uppercase tracking-wide">Booking summary</p>
              <div className="space-y-1 text-sm text-emerald-700">
                <div className="flex justify-between"><span>Service</span><span className="font-medium">{RATES[serviceType]?.label}</span></div>
                <div className="flex justify-between"><span>Frequency</span><span>{FREQ_DISCOUNTS[frequency]?.label}</span></div>
                <div className="flex justify-between"><span>Size</span><span>{activeSqft} sqft · {price.hours}h</span></div>
                {isResidential && bedrooms > 0 && <div className="flex justify-between"><span>Layout</span><span>{bedrooms}bd / {bathrooms}ba</span></div>}
                {isCommercial && <div className="flex justify-between"><span>Sanitary units</span><span>{toilets} toilet{toilets > 1 ? 's' : ''}{urinals > 0 ? ` · ${urinals} urinal${urinals > 1 ? 's' : ''}` : ''}</span></div>}
                {addons.length > 0 && <div className="flex justify-between"><span>Add-ons</span><span>{addons.length} selected</span></div>}
                <div className="flex justify-between font-bold text-emerald-800 text-base pt-2 border-t border-emerald-200">
                  <span>Total</span><span>${price.total}</span>
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-4 py-3">{error}</p>}

            <button type="submit" disabled={loading || !address || !city}
              className="w-full bg-emerald-700 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50 transition-all">
              {loading ? 'Booking...' : `Request service · $${price.total}`}
            </button>
            <p className="text-center text-xs text-gray-400">Cancel free up to 24h before. No hidden fees.</p>
          </div>
        )}
      </form>

      {step >= 2 && <PriceBar price={price} serviceType={serviceType} frequency={frequency} />}
    </div>
  );
}
