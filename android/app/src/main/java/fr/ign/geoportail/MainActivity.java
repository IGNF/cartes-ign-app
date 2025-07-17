package fr.ign.geoportail;

import android.os.Bundle;
import android.webkit.WebView;

import android.content.Intent;
import android.net.Uri;
import android.webkit.ValueCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private String lastHandledUri = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleShareIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleShareIntent(intent);
    }

    @Override
    public void onStart() {
        super.onStart();
        WebView webview = getBridge().getWebView();
        webview.setOverScrollMode(WebView.OVER_SCROLL_NEVER);

        webview.getSettings().setJavaScriptEnabled(true);
        webview.addJavascriptInterface(this, "AndroidInterface");

        handleShareIntent(getIntent());
    }

    private void handleShareIntent(Intent intent) {
        if (intent == null) return;

        String action = intent.getAction();
        String type = intent.getType();

        if (Intent.ACTION_SEND.equals(action) && type != null) {
            Uri fileUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (fileUri != null) {
                String fileUrl = fileUri.toString();
                // Avoid duplicate handling
                if (fileUrl.equals(lastHandledUri)) return;
                lastHandledUri = fileUrl;
                if (bridge != null) {
                    bridge.getActivity().setIntent(new Intent());
                    bridge.eval("window.dispatchEvent(new CustomEvent('sendIntentReceived', {detail: {url:'" + fileUrl + "'}}))", new ValueCallback<String>() {
                        @Override
                        public void onReceiveValue(String s) {
                        }
                    });
                }
            }
        }
    }

    @android.webkit.JavascriptInterface
    public String getSharedFileUrl() {
        return lastHandledUri;
    }
}
