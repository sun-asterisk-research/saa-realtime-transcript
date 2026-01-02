// Simple test script to verify context sets API
// Run with: npx tsx scripts/test-context-api.ts

const API_BASE = 'http://localhost:3000/api';

async function testContextSetsAPI() {
  console.log('🧪 Testing Context Sets API...\n');

  try {
    // Test 1: List public context sets
    console.log('📋 Test 1: GET /api/context-sets (public only)');
    const listResponse = await fetch(`${API_BASE}/context-sets?publicOnly=true`);
    const listData = await listResponse.json();

    if (listResponse.ok) {
      console.log(`✅ Success! Found ${listData.total} public context sets:`);
      listData.contextSets.forEach((cs: any) => {
        console.log(`   - ${cs.name} (${cs.term_count} terms, ${cs.general_count} metadata)`);
      });
    } else {
      console.log(`❌ Failed: ${listData.error}`);
    }
    console.log('');

    // Test 2: Get specific context set
    if (listData.contextSets && listData.contextSets.length > 0) {
      const firstContext = listData.contextSets[0];
      console.log(`📖 Test 2: GET /api/context-sets/${firstContext.id}`);
      const getResponse = await fetch(`${API_BASE}/context-sets/${firstContext.id}`);
      const getData = await getResponse.json();

      if (getResponse.ok) {
        console.log(`✅ Success! Retrieved: ${getData.contextSet.name}`);
        console.log(`   Terms: ${getData.contextSet.terms.slice(0, 3).map((t: any) => t.term).join(', ')}...`);
        console.log(`   General: ${getData.contextSet.general.map((g: any) => `${g.key}=${g.value}`).join(', ')}`);
      } else {
        console.log(`❌ Failed: ${getData.error}`);
      }
      console.log('');
    }

    // Test 3: Create new context set (requires userId)
    console.log('➕ Test 3: POST /api/context-sets');
    const createResponse = await fetch(`${API_BASE}/context-sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '00000000-0000-0000-0000-000000000000', // Test user ID
        name: 'Test Context',
        description: 'Test context set created by API test script',
        is_public: false,
        terms: ['test', 'API', 'automation'],
        general: [
          { key: 'domain', value: 'Testing' },
          { key: 'purpose', value: 'API Testing' },
        ],
        translation_terms: [
          { source: 'test', target: 'test' },
        ],
      }),
    });
    const createData = await createResponse.json();

    if (createResponse.ok) {
      console.log(`✅ Success! Created context set: ${createData.contextSet.name} (ID: ${createData.contextSet.id})`);

      // Test 4: Update the context set
      console.log(`\n✏️  Test 4: PATCH /api/context-sets/${createData.contextSet.id}`);
      const updateResponse = await fetch(`${API_BASE}/context-sets/${createData.contextSet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '00000000-0000-0000-0000-000000000000',
          name: 'Updated Test Context',
          terms: ['updated', 'test', 'terms'],
        }),
      });
      const updateData = await updateResponse.json();

      if (updateResponse.ok) {
        console.log(`✅ Success! Updated to: ${updateData.contextSet.name}`);
        console.log(`   New terms: ${updateData.contextSet.terms.map((t: any) => t.term).join(', ')}`);
      } else {
        console.log(`❌ Failed: ${updateData.error}`);
      }

      // Test 5: Delete the context set
      console.log(`\n🗑️  Test 5: DELETE /api/context-sets/${createData.contextSet.id}`);
      const deleteResponse = await fetch(`${API_BASE}/context-sets/${createData.contextSet.id}?userId=00000000-0000-0000-0000-000000000000`, {
        method: 'DELETE',
      });
      const deleteData = await deleteResponse.json();

      if (deleteResponse.ok) {
        console.log(`✅ Success! Context set deleted`);
      } else {
        console.log(`❌ Failed: ${deleteData.error}`);
      }
    } else {
      console.log(`❌ Failed: ${createData.error}`);
    }

    console.log('\n✨ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testContextSetsAPI();
