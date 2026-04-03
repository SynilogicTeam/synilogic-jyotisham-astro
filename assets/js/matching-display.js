// Additional display functions for matching data
function displayAshtakootMatchingData(data, container) {
    if (data.status !== 200) {
        container.innerHTML = '<div class="jyotisham-card"><p>Error loading ashtakoot data</p></div>';
        return;
    }

    const response = data.response;
    
    // Calculate compatibility percentage
    const compatibilityPercentage = Math.round((response.score / response.total_score) * 100);
    const compatibilityClass = compatibilityPercentage >= 70 ? 'excellent' : compatibilityPercentage >= 50 ? 'good' : 'fair';
    
    container.innerHTML = `
        <div class="jyotisham-content">
            <div class="jyotisham-score-card ${compatibilityClass}">
                <div class="jyotisham-score-header">
                    <h3>🌟 Ashtakoot Matching (8 Points)</h3>
                    <div class="jyotisham-compatibility-badge">${compatibilityPercentage}% Compatible</div>
                </div>
                <div class="jyotisham-score-number">${response.score}/${response.total_score || 36}</div>
                <div class="jyotisham-score-description">${response.bot_response || 'Compatibility analysis based on 8 key factors'}</div>
            </div>
            
            <div class="jyotisham-card">
                <h3>📊 Detailed Ashtakoot Analysis</h3>
                <div class="jyotisham-matching-grid">
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>🕉️ Varna (Spiritual Compatibility)</h4>
                            <div class="jyotisham-score-badge">${response.varna?.varna || 0}/${response.varna?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.varna?.description || 'Spiritual compatibility analysis'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.varna?.boy_varna || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.varna?.girl_varna || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>💕 Vasya (Mutual Attraction)</h4>
                            <div class="jyotisham-score-badge">${response.vasya?.vasya || 0}/${response.vasya?.full_score || 2}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.vasya?.description || 'Mutual attraction and compatibility'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.vasya?.boy_vasya || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.vasya?.girl_vasya || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>⭐ Tara (Wellbeing & Longevity)</h4>
                            <div class="jyotisham-score-badge">${response.tara?.tara || 0}/${response.tara?.full_score || 3}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.tara?.description || 'Health and longevity factors'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.tara?.boy_tara || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.tara?.girl_tara || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>🌹 Yoni (Sensuous Nature)</h4>
                            <div class="jyotisham-score-badge">${response.yoni?.yoni || 0}/${response.yoni?.full_score || 4}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.yoni?.description || 'Intimate compatibility analysis'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.yoni?.boy_yoni || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.yoni?.girl_yoni || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>🧠 Grahamaitri (Mental Compatibility)</h4>
                            <div class="jyotisham-score-badge">${response.grahamaitri?.grahamaitri || 0}/${response.grahamaitri?.full_score || 5}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.grahamaitri?.description || 'Mental and intellectual compatibility'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.grahamaitri?.boy_lord || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.grahamaitri?.girl_lord || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>🎭 Gana (Temperament)</h4>
                            <div class="jyotisham-score-badge">${response.gana?.gana || 0}/${response.gana?.full_score || 6}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.gana?.description || 'Temperament and nature compatibility'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.gana?.boy_gana || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.gana?.girl_gana || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>💝 Bhakoot (Emotional Compatibility)</h4>
                            <div class="jyotisham-score-badge">${response.bhakoot?.bhakoot || 0}/${response.bhakoot?.full_score || 7}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.bhakoot?.description || 'Emotional and psychological compatibility'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.bhakoot?.boy_rasi_name || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.bhakoot?.girl_rasi_name || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>🏥 Nadi (Health & Metabolism)</h4>
                            <div class="jyotisham-score-badge">${response.nadi?.nadi || 0}/${response.nadi?.full_score || 8}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.nadi?.description || 'Health and genetic compatibility'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.nadi?.boy_nadi || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.nadi?.girl_nadi || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            ${response.summary ? `
            <div class="jyotisham-card">
                <h3>📝 Summary</h3>
                <div class="jyotisham-summary-content">
                    <p>${response.summary}</p>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

function displayDashakootMatchingData(data, container) {
    if (data.status !== 200) {
        container.innerHTML = '<div class="jyotisham-card"><p>Error loading dashakoot data</p></div>';
        return;
    }

    const response = data.response;
    
    // Calculate compatibility percentage
    const compatibilityPercentage = Math.round((response.score / 10) * 100);
    const compatibilityClass = compatibilityPercentage >= 70 ? 'excellent' : compatibilityPercentage >= 50 ? 'good' : 'fair';
    
    container.innerHTML = `
        <div class="jyotisham-content">
            <div class="jyotisham-score-card ${compatibilityClass}">
                <div class="jyotisham-score-header">
                    <h3>🔟 Dashakoot Matching (10 Points)</h3>
                    <div class="jyotisham-compatibility-badge">${compatibilityPercentage}% Compatible</div>
                </div>
                <div class="jyotisham-score-number">${response.score}/10</div>
                <div class="jyotisham-score-description">${response.bot_response || 'Advanced compatibility analysis based on 10 key factors'}</div>
            </div>
            
            <div class="jyotisham-card">
                <h3>📈 Detailed Dashakoot Analysis</h3>
                <div class="jyotisham-matching-grid">
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>🏥 Dina (Health & Prosperity)</h4>
                            <div class="jyotisham-score-badge">${response.dina?.dina || 0}/${response.dina?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.dina?.description || 'Health and prosperity compatibility'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.dina?.boy_star || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.dina?.girl_star || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>🎭 Gana (Temperament)</h4>
                            <div class="jyotisham-score-badge">${response.gana?.gana || 0}/${response.gana?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.gana?.description || 'Temperament and nature compatibility'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.gana?.boy_gana || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.gana?.girl_gana || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>👶 Mahendra (Progeny)</h4>
                            <div class="jyotisham-score-badge">${response.mahendra?.mahendra || 0}/${response.mahendra?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.mahendra?.description || 'Progeny and children compatibility'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.mahendra?.boy_star || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.mahendra?.girl_star || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>💰 Sthree Dheerga (Wealth Accumulation)</h4>
                            <div class="jyotisham-score-badge">${response.sthree?.sthree || 0}/${response.sthree?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.sthree?.description || 'Wealth and prosperity accumulation'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.sthree?.boy_star || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.sthree?.girl_star || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>🌹 Yoni (Intimacy)</h4>
                            <div class="jyotisham-score-badge">${response.yoni?.yoni || 0}/${response.yoni?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.yoni?.description || 'Intimate and sensual compatibility'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.yoni?.boy_yoni || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.yoni?.girl_yoni || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>♈ Rasi (Progeny Continuation)</h4>
                            <div class="jyotisham-score-badge">${response.rasi?.rasi || 0}/${response.rasi?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.rasi?.description || 'Progeny continuation and family line'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.rasi?.boy_rasi || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.rasi?.girl_rasi || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>👑 Rasi Adhipathi (Friendship)</h4>
                            <div class="jyotisham-score-badge">${response.rasiathi?.rasiathi || 0}/${response.rasiathi?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.rasiathi?.description || 'Friendship and mutual understanding'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.rasiathi?.boy_lord || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.rasiathi?.girl_lord || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>💕 Vasya (Mutual Attraction)</h4>
                            <div class="jyotisham-score-badge">${response.vasya?.vasya || 0}/${response.vasya?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.vasya?.description || 'Mutual attraction and compatibility'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.vasya?.boy_rasi || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.vasya?.girl_rasi || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>⏳ Rajju (Husband's Longevity)</h4>
                            <div class="jyotisham-score-badge">${response.rajju?.rajju || 0}/${response.rajju?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.rajju?.description || 'Husband\'s longevity and health'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.rajju?.boy_rajju || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.rajju?.girl_rajju || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>⚠️ Vedha (Avoiding Pitfalls)</h4>
                            <div class="jyotisham-score-badge">${response.vedha?.vedha || 0}/${response.vedha?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.vedha?.description || 'Avoiding pitfalls and obstacles'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.vedha?.boy_star || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.vedha?.girl_star || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            ${response.summary ? `
            <div class="jyotisham-card">
                <h3>📝 Summary</h3>
                <div class="jyotisham-summary-content">
                    <p>${response.summary}</p>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

function displayAggregateMatchingData(data, container) {
    if (data.status !== 200) {
        container.innerHTML = '<div class="jyotisham-card"><p>Error loading aggregate data</p></div>';
        return;
    }

    const response = data.response;
    
    // Calculate compatibility percentage
    const compatibilityPercentage = Math.round(response.score);
    const compatibilityClass = compatibilityPercentage >= 70 ? 'excellent' : compatibilityPercentage >= 50 ? 'good' : 'fair';
    
    container.innerHTML = `
        <div class="jyotisham-content">
            <div class="jyotisham-score-card ${compatibilityClass}">
                <div class="jyotisham-score-header">
                    <h3>🎯 Overall Compatibility Score</h3>
                    <div class="jyotisham-compatibility-badge">${compatibilityPercentage}% Compatible</div>
                </div>
                <div class="jyotisham-score-number">${response.score}/100</div>
                <div class="jyotisham-score-description">${response.bot_response || 'Comprehensive compatibility analysis'}</div>
            </div>
            
            <div class="jyotisham-card">
                <h3>📊 Compatibility Breakdown</h3>
                <div class="jyotisham-matching-grid">
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>🌟 Ashtakoot Score</h4>
                            <div class="jyotisham-score-badge">${response.ashtakoot_score || 'N/A'}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">8-point compatibility analysis</div>
                        </div>
                    </div>
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>🔟 Dashakoot Score</h4>
                            <div class="jyotisham-score-badge">${response.dashkoot_score || 'N/A'}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">10-point advanced analysis</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="jyotisham-card">
                <h3>⚠️ Dosha Analysis</h3>
                <div class="jyotisham-dosha-grid">
                    <div class="jyotisham-dosha-card ${response.rajjudosh ? 'negative' : 'positive'}">
                        <div class="dosha-header">
                            <h4>⏳ Rajju Dosha</h4>
                            <div class="dosha-status ${response.rajjudosh ? 'present' : 'absent'}">${response.rajjudosh ? 'Present' : 'Absent'}</div>
                        </div>
                        <p>Husband's longevity factor</p>
                        ${response.rajjudosh ? '<div class="dosha-warning">⚠️ May affect husband\'s longevity</div>' : '<div class="dosha-success">✅ No issues with longevity</div>'}
                    </div>
                    
                    <div class="jyotisham-dosha-card ${response.vedhadosh ? 'negative' : 'positive'}">
                        <div class="dosha-header">
                            <h4>🚫 Vedha Dosha</h4>
                            <div class="dosha-status ${response.vedhadosh ? 'present' : 'absent'}">${response.vedhadosh ? 'Present' : 'Absent'}</div>
                        </div>
                        <p>Pitfall avoidance factor</p>
                        ${response.vedhadosh ? '<div class="dosha-warning">⚠️ May face obstacles in marriage</div>' : '<div class="dosha-success">✅ No major obstacles expected</div>'}
                    </div>
                    
                    <div class="jyotisham-dosha-card ${(response.mangaldosh_points?.boy > 0 || response.mangaldosh_points?.girl > 0) ? 'neutral' : 'positive'}">
                        <div class="dosha-header">
                            <h4>🔴 Mangal Dosha</h4>
                            <div class="dosha-status ${(response.mangaldosh_points?.boy > 0 || response.mangaldosh_points?.girl > 0) ? 'present' : 'absent'}">${(response.mangaldosh_points?.boy > 0 || response.mangaldosh_points?.girl > 0) ? 'Present' : 'Absent'}</div>
                        </div>
                        <p>Mars influence analysis</p>
                        <div class="dosha-details">
                            <span class="boy-detail">Boy: ${response.mangaldosh_points?.boy || 0}%</span>
                            <span class="girl-detail">Girl: ${response.mangaldosh_points?.girl || 0}%</span>
                        </div>
                        <div class="dosha-description">${response.mangaldosh || 'Mars influence analysis'}</div>
                    </div>
                    
                    <div class="jyotisham-dosha-card ${(response.pitradosh_points?.boy || response.pitradosh_points?.girl) ? 'negative' : 'positive'}">
                        <div class="dosha-header">
                            <h4>👴 Pitra Dosha</h4>
                            <div class="dosha-status ${(response.pitradosh_points?.boy || response.pitradosh_points?.girl) ? 'present' : 'absent'}">${(response.pitradosh_points?.boy || response.pitradosh_points?.girl) ? 'Present' : 'Absent'}</div>
                        </div>
                        <p>Ancestral influence</p>
                        <div class="dosha-details">
                            <span class="boy-detail">Boy: ${response.pitradosh_points?.boy ? 'Present' : 'Absent'}</span>
                            <span class="girl-detail">Girl: ${response.pitradosh_points?.girl ? 'Present' : 'Absent'}</span>
                        </div>
                        <div class="dosha-description">${response.pitra_dosh || 'Ancestral influence analysis'}</div>
                    </div>
                    
                    <div class="jyotisham-dosha-card ${(response.kaalsarp_points?.boy || response.kaalsarp_points?.girl) ? 'negative' : 'positive'}">
                        <div class="dosha-header">
                            <h4>🐍 Kaal Sarp Dosha</h4>
                            <div class="dosha-status ${(response.kaalsarp_points?.boy || response.kaalsarp_points?.girl) ? 'present' : 'absent'}">${(response.kaalsarp_points?.boy || response.kaalsarp_points?.girl) ? 'Present' : 'Absent'}</div>
                        </div>
                        <p>Snake constellation influence</p>
                        <div class="dosha-details">
                            <span class="boy-detail">Boy: ${response.kaalsarp_points?.boy ? 'Present' : 'Absent'}</span>
                            <span class="girl-detail">Girl: ${response.kaalsarp_points?.girl ? 'Present' : 'Absent'}</span>
                        </div>
                        <div class="dosha-description">${response.kaalsarpdosh || 'Snake constellation influence analysis'}</div>
                    </div>
                </div>
            </div>
            
            ${response.extended_response ? `
            <div class="jyotisham-card">
                <h3>📝 Extended Analysis</h3>
                <div class="jyotisham-summary-content">
                    <p>${response.extended_response}</p>
                </div>
            </div>
            ` : ''}
            
            ${response.recommendations ? `
            <div class="jyotisham-card">
                <h3>💡 Recommendations</h3>
                <div class="jyotisham-recommendations">
                    <p>${response.recommendations}</p>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

function displayNakshatraMatchingData(data, container) {
    if (data.status !== 200) {
        container.innerHTML = '<div class="jyotisham-card"><p>Error loading nakshatra data</p></div>';
        return;
    }

    const response = data.response;
    
    // Calculate compatibility percentage
    const compatibilityPercentage = Math.round((response.score / 10) * 100);
    const compatibilityClass = compatibilityPercentage >= 70 ? 'excellent' : compatibilityPercentage >= 50 ? 'good' : 'fair';
    
    container.innerHTML = `
        <div class="jyotisham-content">
            <div class="jyotisham-score-card ${compatibilityClass}">
                <div class="jyotisham-score-header">
                    <h3>⭐ Nakshatra Matching</h3>
                    <div class="jyotisham-compatibility-badge">${compatibilityPercentage}% Compatible</div>
                </div>
                <div class="jyotisham-score-number">${response.score}/10</div>
                <div class="jyotisham-score-description">${response.bot_response || 'Nakshatra-based compatibility analysis'}</div>
            </div>
            
            <div class="jyotisham-card">
                <h3>🌟 Detailed Nakshatra Analysis</h3>
                <div class="jyotisham-matching-grid">
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>🏥 Dina (Health & Prosperity)</h4>
                            <div class="jyotisham-score-badge">${response.dina?.dina || 0}/${response.dina?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.dina?.description || 'Health and prosperity compatibility'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.dina?.boy_star || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.dina?.girl_star || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>🎭 Gana (Temperament)</h4>
                            <div class="jyotisham-score-badge">${response.gana?.gana || 0}/${response.gana?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.gana?.description || 'Temperament and nature compatibility'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.gana?.boy_gana || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.gana?.girl_gana || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>👶 Mahendra (Progeny)</h4>
                            <div class="jyotisham-score-badge">${response.mahendra?.mahendra || 0}/${response.mahendra?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.mahendra?.description || 'Progeny and children compatibility'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.mahendra?.boy_star || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.mahendra?.girl_star || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>💰 Sthree Dheerga (Wealth)</h4>
                            <div class="jyotisham-score-badge">${response.sthree?.sthree || 0}/${response.sthree?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.sthree?.description || 'Wealth and prosperity accumulation'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.sthree?.boy_star || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.sthree?.girl_star || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>🌹 Yoni (Intimacy)</h4>
                            <div class="jyotisham-score-badge">${response.yoni?.yoni || 0}/${response.yoni?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.yoni?.description || 'Intimate and sensual compatibility'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.yoni?.boy_yoni || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.yoni?.girl_yoni || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>♈ Rasi (Progeny Continuation)</h4>
                            <div class="jyotisham-score-badge">${response.rasi?.rasi || 0}/${response.rasi?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.rasi?.description || 'Progeny continuation and family line'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.rasi?.boy_rasi || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.rasi?.girl_rasi || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>👑 Rasi Adhipathi (Friendship)</h4>
                            <div class="jyotisham-score-badge">${response.rasiathi?.rasiathi || 0}/${response.rasiathi?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.rasiathi?.description || 'Friendship and mutual understanding'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.rasiathi?.boy_lord || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.rasiathi?.girl_lord || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>💕 Vasya (Mutual Attraction)</h4>
                            <div class="jyotisham-score-badge">${response.vasya?.vasya || 0}/${response.vasya?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.vasya?.description || 'Mutual attraction and compatibility'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.vasya?.boy_rasi || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.vasya?.girl_rasi || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>⏳ Rajju (Husband's Longevity)</h4>
                            <div class="jyotisham-score-badge">${response.rajju?.rajju || 0}/${response.rajju?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.rajju?.description || 'Husband\'s longevity and health'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.rajju?.boy_rajju || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.rajju?.girl_rajju || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="jyotisham-matching-item">
                        <div class="jyotisham-matching-header">
                            <h4>⚠️ Vedha (Avoiding Pitfalls)</h4>
                            <div class="jyotisham-score-badge">${response.vedha?.vedha || 0}/${response.vedha?.full_score || 1}</div>
                        </div>
                        <div class="jyotisham-matching-content">
                            <div class="description">${response.vedha?.description || 'Avoiding pitfalls and obstacles'}</div>
                            <div class="jyotisham-person-details">
                                <span class="boy-detail"><strong>Boy:</strong> ${response.vedha?.boy_star || 'N/A'}</span>
                                <span class="girl-detail"><strong>Girl:</strong> ${response.vedha?.girl_star || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            ${response.summary ? `
            <div class="jyotisham-card">
                <h3>📝 Summary</h3>
                <div class="jyotisham-summary-content">
                    <p>${response.summary}</p>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

function displayPersonMatchingDetails(data, container, personType) {
    if (!data || Object.keys(data).length === 0) {
        container.innerHTML = '<div class="jyotisham-card"><p>No details available</p></div>';
        return;
    }

    container.innerHTML = `
        <div class="jyotisham-content">
            <div class="jyotisham-card">
                <h3>${personType}'s Astrological Details</h3>
                <div class="jyotisham-table-container">
                    <table class="jyotisham-data-table">
                        <tr><td><strong>Gana</strong></td><td>${data.gana || 'N/A'}</td></tr>
                        <tr><td><strong>Yoni</strong></td><td>${data.yoni || 'N/A'}</td></tr>
                        <tr><td><strong>Vasya</strong></td><td>${data.vasya || 'N/A'}</td></tr>
                        <tr><td><strong>Nadi</strong></td><td>${data.nadi || 'N/A'}</td></tr>
                        <tr><td><strong>Varna</strong></td><td>${data.varna || 'N/A'}</td></tr>
                        <tr><td><strong>Paya</strong></td><td>${data.paya || 'N/A'}</td></tr>
                        <tr><td><strong>Tatva</strong></td><td>${data.tatva || 'N/A'}</td></tr>
                        <tr><td><strong>Rasi</strong></td><td>${data.rasi || 'N/A'}</td></tr>
                        <tr><td><strong>Nakshatra</strong></td><td>${data.nakshatra || 'N/A'}</td></tr>
                        <tr><td><strong>Nakshatra Pada</strong></td><td>${data.nakshatra_pada || 'N/A'}</td></tr>
                        <tr><td><strong>Ascendant Sign</strong></td><td>${data.ascendant_sign || 'N/A'}</td></tr>
                    </table>
                </div>
            </div>
            
            <div class="jyotisham-card">
                <h3>Lucky Details</h3>
                <div class="jyotisham-table-container">
                    <table class="jyotisham-data-table">
                        <tr><td><strong>Lucky Gem</strong></td><td>${Array.isArray(data.lucky_gem) ? data.lucky_gem.join(', ') : data.lucky_gem || 'N/A'}</td></tr>
                        <tr><td><strong>Lucky Number</strong></td><td>${Array.isArray(data.lucky_num) ? data.lucky_num.join(', ') : data.lucky_num || 'N/A'}</td></tr>
                        <tr><td><strong>Lucky Colors</strong></td><td>${Array.isArray(data.lucky_colors) ? data.lucky_colors.join(', ') : data.lucky_colors || 'N/A'}</td></tr>
                        <tr><td><strong>Lucky Letters</strong></td><td>${Array.isArray(data.lucky_letters) ? data.lucky_letters.join(', ') : data.lucky_letters || 'N/A'}</td></tr>
                        <tr><td><strong>Lucky Name Start</strong></td><td>${Array.isArray(data.lucky_name_start) ? data.lucky_name_start.join(', ') : data.lucky_name_start || 'N/A'}</td></tr>
                    </table>
                </div>
            </div>
            
            <div class="jyotisham-card">
                <h3>Dasha Information</h3>
                <div class="jyotisham-table-container">
                    <table class="jyotisham-data-table">
                        <tr><td><strong>Birth Dasa</strong></td><td>${data.birth_dasa || 'N/A'}</td></tr>
                        <tr><td><strong>Current Dasa</strong></td><td>${data.current_dasa || 'N/A'}</td></tr>
                        <tr><td><strong>Birth Dasa Time</strong></td><td>${data.birth_dasa_time || 'N/A'}</td></tr>
                        <tr><td><strong>Current Dasa Time</strong></td><td>${data.current_dasa_time || 'N/A'}</td></tr>
                    </table>
                </div>
            </div>
        </div>
    `;
}
