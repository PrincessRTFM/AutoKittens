#loadmodule utils
#noblanks

#loadmodule strftime
#loadmodule strlib

#define PROJECT_NAME AutoKittens

#define ID_PREFIX $CONCAT($PROJECT_NAME, _)

#define BASIC_DEBUG_TOGGLE $CONCAT($CASE_UPPER($PROJECT_NAME), _ENABLE_DEBUG)
#define NOISY_DEBUG_TOGGLE $CONCAT($BASIC_DEBUG_TOGGLE, _SPAM)

#define SCRIPT_OPTS $CONCAT($PROJECT_NAME, Options)
#define SCRIPT_CACHE $CONCAT($PROJECT_NAME, Cache)
#define SCRIPT_RESMAP resmap

#ifdef __OUTPUT_STDOUT__
	#define NO_UPDATE_CHECK
	#define UPDATE_CHECK_LABEL Update check unavailable
	#define UPDATE_URL
#else
	#define UPDATE_CHECK_LABEL Check for update
	#define UPDATE_URL https://princessrtfm.github.io/$PROJECT_NAME/$__OUTPUT_FILE__
#endif

#kwprefix // #
