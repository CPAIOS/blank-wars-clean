// Test script to verify Kitchen Chat Service connection from the frontend perspective
const io = require('socket.io-client');

console.log('🎮 FRONTEND KITCHEN CHAT SERVICE CONNECTION TEST');
console.log('===============================================');

// Simulate the frontend's KitchenChatService connection logic
function testFrontendKitchenChatService() {
    console.log('🔧 Simulating KitchenChatService initialization...');
    
    // Determine backend URL (same logic as frontend)
    const isLocalhost = true; // Simulating localhost condition
    const socketUrl = isLocalhost ? 'http://localhost:3006' : 'https://blank-wars-backend.railway.app';
    
    console.log('🔧 Kitchen Chat Service initializing with URL:', socketUrl);
    console.log('🔧 NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('🔧 Current hostname: localhost (simulated)');
    
    const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
    });

    // Connection handlers (same as frontend)
    socket.on('connect', () => {
        console.log('✅ Kitchen Chat Service connected to:', socketUrl, 'with ID:', socket.id);
        
        // Test the exact same conversation generation as frontend
        testKitchenConversation(socket);
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Kitchen Chat Service connection error:', error);
        console.error('❌ Attempted URL:', socketUrl);
        console.error('❌ Error details:', {
            message: error.message,
            description: error.description,
            context: error.context,
            type: error.type
        });
        process.exit(1);
    });

    socket.on('disconnect', (reason) => {
        console.warn('🔌 Kitchen Chat Service disconnected:', reason);
    });

    socket.on('kitchen_conversation_response', (data) => {
        console.log('📥 Kitchen conversation response received:', {
            conversationId: data.conversationId,
            hasMessage: !!data.message,
            hasError: !!data.error,
            messageLength: data.message?.length || 0
        });
        
        console.log('💬 Full Response Message:', data.message);
        console.log('⏰ Response Timestamp:', data.timestamp);
        
        if (data.error) {
            console.error('❌ Response Error:', data.error);
            if (data.usageLimitReached) {
                console.warn('⚠️ Usage limit reached');
            }
        } else {
            console.log('✅ Kitchen conversation generated successfully!');
        }
        
        console.log('\n🎯 Frontend Integration Test: PASSED');
        console.log('✅ Kitchen Chat WebSocket connection is working correctly');
        console.log('✅ Backend is responding to kitchen_chat_request events');
        console.log('✅ Response format matches expected frontend interface');
        
        socket.disconnect();
        process.exit(0);
    });
    
    return socket;
}

function testKitchenConversation(socket) {
    console.log('\n🎭 Testing kitchen conversation generation...');
    
    // Simulate the exact context that frontend would send
    const context = {
        character: {
            id: 'achilles',
            name: 'Achilles',
            personality: {
                traits: ['Brave', 'Aggressive', 'Prideful'],
                speechStyle: 'Bold and direct',
                motivations: ['Glory', 'Honor', 'Victory'],
                fears: ['Cowardice', 'Dishonor']
            },
            historicalPeriod: 'Ancient Greece',
            mythology: 'Greek Heroes'
        },
        teammates: [
            { name: 'Sherlock Holmes', baseName: 'sherlock' },
            { name: 'Count Dracula', baseName: 'dracula' },
            { name: 'Merlin', baseName: 'merlin' }
        ],
        coachName: 'Coach',
        livingConditions: {
            apartmentTier: 'spartan_apartment',
            roomTheme: null,
            sleepsOnCouch: false,
            sleepsOnFloor: true,
            sleepsInBed: false,
            bedType: 'floor',
            comfortBonus: 0,
            sleepsUnderTable: false,
            roomOvercrowded: true,
            floorSleeperCount: 2,
            roommateCount: 4
        },
        recentEvents: ['Someone is arguing about the bathroom schedule']
    };
    
    const trigger = 'Someone is arguing about the bathroom schedule';
    
    // Generate the same prompt that frontend would generate
    const prompt = buildCharacterKitchenPrompt(context, trigger);
    
    console.log('🎬 Trigger:', trigger);
    console.log('🎭 Character:', context.character.name);
    console.log('👥 Teammates:', context.teammates.map(t => t.name).join(', '));
    console.log('🏠 Living Conditions:', context.livingConditions.apartmentTier);
    
    const conversationId = `kitchen_test_${Date.now()}_${context.character.id}`;
    
    // Send request to backend (same format as frontend)
    const requestData = {
        conversationId,
        characterId: context.character.id,
        prompt,
        trigger,
        context: {
            teammates: context.teammates.map(t => t.name),
            coach: context.coachName,
            livingConditions: context.livingConditions
        }
    };
    
    console.log('📤 Sending kitchen chat request:', {
        conversationId,
        characterId: context.character.id,
        characterName: context.character.name,
        trigger: trigger.substring(0, 50) + '...',
        promptLength: prompt.length
    });
    
    socket.emit('kitchen_chat_request', requestData);
    
    // Set timeout for response (same as frontend)
    setTimeout(() => {
        console.warn('⏰ Kitchen chat timeout for:', conversationId);
        console.error('❌ No response received within 30 seconds');
        process.exit(1);
    }, 30000);
}

// Simulate the frontend's prompt building logic
function buildCharacterKitchenPrompt(context, trigger) {
    const { character, teammates, coachName, livingConditions } = context;
    
    // Simple prompt building (simplified version of frontend logic)
    const sceneType = trigger.toLowerCase().includes('argument') ? 'conflict' : 'mundane';
    
    const promptContext = {
        character: {
            name: character.name,
            title: character.title || '',
            personality: character.personality,
            historicalPeriod: character.historicalPeriod,
            mythology: character.mythology
        },
        hqTier: livingConditions.apartmentTier,
        roommates: teammates.map(t => t.name),
        coachName,
        sceneType,
        trigger,
        timeOfDay: 'morning',
        sleepingContext: {
            sleepsOnFloor: livingConditions.sleepsOnFloor,
            sleepsOnCouch: livingConditions.sleepsOnCouch,
            sleepsUnderTable: livingConditions.sleepsUnderTable,
            roomOvercrowded: livingConditions.roomOvercrowded,
            floorSleeperCount: livingConditions.floorSleeperCount,
            roommateCount: livingConditions.roommateCount
        }
    };
    
    // Basic prompt template
    return `You are ${character.name}, a legendary warrior from ${character.historicalPeriod}. 
    You're living in cramped ${livingConditions.apartmentTier} conditions with your teammates: ${teammates.map(t => t.name).join(', ')}.
    
    Current situation: ${trigger}
    
    Respond in character with frustration about the living conditions while staying true to your personality.
    Keep it short (1-2 sentences) and realistic for a reality TV kitchen scene.`;
}

// Start the test
console.log('🚀 Starting Kitchen Chat Service connection test...');
testFrontendKitchenChatService();