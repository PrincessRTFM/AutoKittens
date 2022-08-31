#loadmodule utils
#noblanks

#loadmodule strftime
#loadmodule strlib

#define PROJECT_NAME AutoKittens
#define UPDATE_URL https://princessrtfm.github.io/$PROJECT_NAME/$__OUTPUT_FILE__

#ifdef __OUTPUT_STDOUT__
	#define NO_UPDATE_CHECK
	#define UPDATE_CHECK_LABEL Update check unavailable
#else
	#define UPDATE_CHECK_LABEL Check for update
#endif

#kwprefix // #